#!/usr/bin/env node

/**
 * 重新计算所有现有likes的match scores（详细版本）
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
      LIMIT 5
    `);
    
    console.log(`检查最近 ${likes.length} 条likes记录\n`);
    
    for (const like of likes) {
      console.log(`\n========== Like ${like.id} ==========`);
      
      // 获取学生profile
      const [profiles] = await conn.execute(
        'SELECT skills, interests FROM student_profiles WHERE user_id = ?',
        [like.student_id]
      );
      
      if (profiles.length === 0) {
        console.log(`跳过: 学生 ${like.student_id} 没有profile`);
        continue;
      }
      
      const profile = profiles[0];
      
      // 获取教授信息
      const [professors] = await conn.execute(
        'SELECT name, tags FROM professors WHERE id = ?',
        [like.professor_id]
      );
      
      if (professors.length === 0) {
        console.log(`跳过: 教授 ${like.professor_id} 不存在`);
        continue;
      }
      
      const professor = professors[0];
      console.log(`教授: ${professor.name}`);
      
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
      
      console.log(`\n学生标签 (${studentTags.length}):`);
      console.log(studentTags.join(', '));
      
      console.log(`\n教授标签 (${professorTags.length}):`);
      console.log(professorTags.join(', '));
      
      const studentTagsLower = studentTags.map(t => t.toLowerCase());
      
      // 计算匹配
      const matchedTags = professorTags.filter(tag => 
        studentTagsLower.some(st => st.includes(tag.toLowerCase()) || tag.toLowerCase().includes(st))
      );
      
      console.log(`\n匹配的标签 (${matchedTags.length}):`);
      if (matchedTags.length > 0) {
        console.log(matchedTags.join(', '));
      } else {
        console.log('(无匹配)');
      }
      
      let newScore = 0;
      const totalTags = Math.max(professorTags.length, studentTags.length);
      
      if (matchedTags.length > 0) {
        // 有匹配：基于重叠 + 小范围随机
        const baseScore = Math.round((matchedTags.length / totalTags) * 100);
        const randomVariation = Math.floor(Math.random() * 11) - 5;
        newScore = Math.max(60, Math.min(100, baseScore + randomVariation));
        console.log(`\n计算: ${matchedTags.length}/${totalTags} = ${baseScore}% + 随机(${randomVariation}) = ${newScore}%`);
      } else {
        // 无匹配：60-85随机
        newScore = 60 + Math.floor(Math.random() * 26);
        console.log(`\n计算: 无匹配，随机生成 = ${newScore}%`);
      }
      
      console.log(`旧分数: ${like.old_score}% → 新分数: ${newScore}%`);
    }
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await conn.end();
  }
}

recalculateMatchScores();
