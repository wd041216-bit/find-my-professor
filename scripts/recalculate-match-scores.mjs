#!/usr/bin/env node

/**
 * 重新计算所有现有likes的match scores
 * 
 * 使用新的算法：
 * - 有匹配：基于重叠标签 + 小范围随机变化
 * - 无匹配：60-85之间的随机分数
 */

import { createConnection } from 'mysql2/promise';

const DB_URL = process.env.DATABASE_URL;

async function recalculateMatchScores() {
  console.log('开始重新计算match scores...\n');
  
  const conn = await createConnection(DB_URL);
  
  try {
    // 获取所有likes
    const [likes] = await conn.execute(`
      SELECT sl.id, sl.student_id, sl.professor_id, sl.match_score as old_score
      FROM student_likes sl
      ORDER BY sl.created_at DESC
    `);
    
    console.log(`找到 ${likes.length} 条likes记录\n`);
    
    let updated = 0;
    
    for (const like of likes) {
      // 获取学生profile
      const [profiles] = await conn.execute(
        'SELECT skills, interests FROM student_profiles WHERE user_id = ?',
        [like.student_id]
      );
      
      if (profiles.length === 0) {
        console.log(`跳过 like ${like.id}: 学生 ${like.student_id} 没有profile`);
        continue;
      }
      
      const profile = profiles[0];
      
      // 获取教授信息
      const [professors] = await conn.execute(
        'SELECT tags FROM professors WHERE id = ?',
        [like.professor_id]
      );
      
      if (professors.length === 0) {
        console.log(`跳过 like ${like.id}: 教授 ${like.professor_id} 不存在`);
        continue;
      }
      
      const professor = professors[0];
      
      // 解析标签
      let professorTags = [];
      if (professor.tags) {
        if (Array.isArray(professor.tags)) {
          professorTags = professor.tags;
        } else if (typeof professor.tags === 'string') {
          professorTags = professor.tags.split(',').map(t => t.trim());
        }
      }
      
      let studentTags = [];
      if (profile.skills) {
        try {
          const skills = JSON.parse(profile.skills);
          studentTags = [...studentTags, ...skills];
        } catch (e) {}
      }
      if (profile.interests) {
        try {
          const interests = JSON.parse(profile.interests);
          studentTags = [...studentTags, ...interests];
        } catch (e) {}
      }
      studentTags = studentTags.map(t => t.toLowerCase());
      
      // 计算匹配
      const matchedTags = professorTags.filter(tag => 
        studentTags.some(st => st.includes(tag.toLowerCase()) || tag.toLowerCase().includes(st))
      );
      
      let newScore = 0;
      const totalTags = Math.max(professorTags.length, studentTags.length);
      
      if (matchedTags.length > 0) {
        // 有匹配：基于重叠 + 小范围随机
        newScore = Math.round((matchedTags.length / totalTags) * 100);
        const randomVariation = Math.floor(Math.random() * 11) - 5;
        newScore = Math.max(60, Math.min(100, newScore + randomVariation));
      } else {
        // 无匹配：60-85随机
        newScore = 60 + Math.floor(Math.random() * 26);
      }
      
      // 更新数据库
      await conn.execute(
        'UPDATE student_likes SET match_score = ? WHERE id = ?',
        [newScore, like.id]
      );
      
      updated++;
      console.log(`✓ Like ${like.id}: ${like.old_score}% → ${newScore}% (匹配: ${matchedTags.length}/${totalTags})`);
    }
    
    console.log(`\n完成！更新了 ${updated} 条记录`);
    
    // 显示新的分布
    const [distribution] = await conn.execute(`
      SELECT match_score, COUNT(*) as count 
      FROM student_likes 
      GROUP BY match_score 
      ORDER BY match_score
    `);
    
    console.log('\n新的分数分布：');
    console.table(distribution);
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await conn.end();
  }
}

recalculateMatchScores();
