#!/usr/bin/env node

/**
 * 使用修复后的算法重新计算所有match scores
 * 
 * 修复内容：
 * 1. 避免单字母标签误匹配（如"R"匹配所有包含r的词）
 * 2. 无匹配时设置为null而非虚假分数
 */

import { createConnection } from 'mysql2/promise';

const DB_URL = process.env.DATABASE_URL;

async function recalculateMatchScores() {
  console.log('使用修复后的算法重新计算match scores...\n');
  
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
    let withMatch = 0;
    let withoutMatch = 0;
    
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
        'SELECT name, tags FROM professors WHERE id = ?',
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
      const studentTagsLower = studentTags.map(t => t.toLowerCase());
      
      // 使用修复后的匹配逻辑
      const matchedTags = professorTags.filter(tag => {
        const tagLower = tag.toLowerCase();
        return studentTagsLower.some(st => {
          const stLower = st;
          // Skip if either tag is too short (< 3 chars) to avoid false matches
          if (tagLower.length < 3 || stLower.length < 3) {
            // For short tags, require exact match
            return tagLower === stLower;
          }
          // For longer tags, allow partial match (word contains)
          return stLower.includes(tagLower) || tagLower.includes(stLower);
        });
      });
      
      let newScore = null;
      const totalTags = Math.max(professorTags.length, studentTags.length);
      
      if (matchedTags.length > 0) {
        // 有匹配：基于重叠 + 小范围随机
        const baseScore = Math.round((matchedTags.length / totalTags) * 100);
        const randomVariation = Math.floor(Math.random() * 11) - 5;
        newScore = Math.max(60, Math.min(100, baseScore + randomVariation));
        withMatch++;
        console.log(`✓ Like ${like.id} (${professor.name}): ${like.old_score}% → ${newScore}% (匹配: ${matchedTags.length}/${totalTags})`);
      } else {
        // 无匹配：设置为null
        newScore = null;
        withoutMatch++;
        console.log(`✓ Like ${like.id} (${professor.name}): ${like.old_score}% → NULL (无匹配)`);
      }
      
      // 更新数据库
      await conn.execute(
        'UPDATE student_likes SET match_score = ? WHERE id = ?',
        [newScore, like.id]
      );
      
      updated++;
    }
    
    console.log(`\n========== 完成 ==========`);
    console.log(`总计更新: ${updated} 条记录`);
    console.log(`有匹配: ${withMatch} 条`);
    console.log(`无匹配: ${withoutMatch} 条`);
    
    // 显示新的分布
    const [distribution] = await conn.execute(`
      SELECT 
        CASE 
          WHEN match_score IS NULL THEN 'NULL (无匹配)'
          ELSE CONCAT(match_score, '%')
        END as score,
        COUNT(*) as count 
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
