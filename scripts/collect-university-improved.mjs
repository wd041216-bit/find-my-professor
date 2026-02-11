/**
 * 改进版大学教授数据收集脚本
 * 增强JSON解析逻辑，提高成功率到90%+
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

/**
 * 改进的JSON解析函数
 * 处理多种格式和特殊字符
 */
function parseJSON(content) {
  if (!content) return null;

  // 1. 清理内容：移除markdown代码块标记
  let cleaned = content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  // 2. 尝试直接解析
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // 继续尝试其他方法
  }

  // 3. 正则提取JSON数组
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // 继续尝试修复
    }
  }

  // 4. 修复常见JSON格式问题
  try {
    // 修复单引号
    let fixed = cleaned.replace(/'/g, '"');
    
    // 修复未转义的换行符
    fixed = fixed.replace(/\n/g, '\\n');
    
    // 修复尾随逗号
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // 再次尝试提取数组
    const match = fixed.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // 最后一次尝试
  }

  // 5. 尝试逐行解析对象
  try {
    const objects = [];
    const objectMatches = cleaned.matchAll(/\{[^{}]*\}/g);
    
    for (const match of objectMatches) {
      try {
        const obj = JSON.parse(match[0]);
        if (obj.name) objects.push(obj);
      } catch (e) {
        continue;
      }
    }
    
    if (objects.length > 0) return objects;
  } catch (e) {
    // 放弃
  }

  return null;
}

/**
 * 查询单个专业的教授
 */
async function collectProfessorsForMajor(universityName, major, retryCount = 0) {
  try {
    const prompt = `List exactly 3 renowned professors currently teaching undergraduate courses at ${universityName} in the ${major} major/department. Return ONLY a valid JSON array with no extra text, markdown, or explanation. Format:
[{"name":"Full Name","title":"Professor","department":"${major}","tags":["tag1","tag2","tag3","tag4","tag5"]}]

IMPORTANT: Return pure JSON only, no markdown code blocks, no explanations.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error(`[${major}] API Error ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.log(`[${major}] No content`);
      return [];
    }

    // 使用改进的JSON解析
    const professors = parseJSON(content);

    if (!professors || professors.length === 0) {
      // 如果第一次失败，重试一次
      if (retryCount === 0) {
        console.log(`[${major}] Parse failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return collectProfessorsForMajor(universityName, major, 1);
      }
      console.log(`[${major}] ✗ Parse failed after retry`);
      return [];
    }

    console.log(`[${major}] ✓ ${professors.length} professors`);

    // 转换为数据库格式，验证数据
    return professors.map(prof => ({
      name: prof.name || 'Unknown',
      university_name: universityName,
      department: major || 'Unknown',
      research_field: major || 'Unknown',
      title: prof.title || 'Professor',
      research_areas: prof.tags ? prof.tags.join(', ') : '',
      tags: Array.isArray(prof.tags) ? prof.tags : [],
    })).filter(prof => prof.name !== 'Unknown');

  } catch (error) {
    console.error(`[${major}] Error:`, error.message);
    return [];
  }
}

/**
 * 批量保存教授到数据库
 */
async function saveProfessorsToDatabase(professors) {
  if (professors.length === 0) return;

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    for (const prof of professors) {
      const tagsJson = JSON.stringify(prof.tags);
      
      await connection.execute(
        `INSERT INTO professors (name, university_name, department, research_field, title, research_areas, tags, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         research_areas = VALUES(research_areas),
         tags = VALUES(tags),
         updatedAt = NOW()`,
        [
          prof.name,
          prof.university_name,
          prof.department,
          prof.research_field,
          prof.title,
          prof.research_areas,
          tagsJson,
        ]
      );
    }

    console.log(`  → Saved ${professors.length} to database\n`);
  } finally {
    await connection.end();
  }
}

/**
 * 收集指定大学的教授数据
 */
async function collectUniversity(universityName, majors) {
  console.log(`\n=== Collecting ${universityName} professors (${majors.length} majors) ===\n`);

  // 删除该大学的旧数据
  const connection = await mysql.createConnection(DATABASE_URL);
  try {
    const [result] = await connection.execute(
      'DELETE FROM professors WHERE university_name = ?',
      [universityName]
    );
    console.log(`[Database] Deleted ${result.affectedRows} old ${universityName} records\n`);
  } finally {
    await connection.end();
  }

  let allProfessors = [];
  let completedMajors = 0;
  let successCount = 0;

  // 逐个处理专业
  for (const major of majors) {
    console.log(`[${completedMajors + 1}/${majors.length}] ${major}...`);

    const professors = await collectProfessorsForMajor(universityName, major);
    
    if (professors.length > 0) {
      allProfessors.push(...professors);
      successCount++;
    }

    completedMajors++;

    // 每收集15个教授保存一次
    if (allProfessors.length >= 15) {
      await saveProfessorsToDatabase(allProfessors);
      allProfessors = [];
    }

    // 延迟2秒避免速率限制
    if (completedMajors < majors.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 保存剩余的教授
  if (allProfessors.length > 0) {
    await saveProfessorsToDatabase(allProfessors);
  }

  // 统计结果
  const conn = await mysql.createConnection(DATABASE_URL);
  try {
    const [result] = await conn.execute(
      'SELECT COUNT(*) as count FROM professors WHERE university_name = ?',
      [universityName]
    );
    const count = result[0].count;
    console.log(`\n=== Collection completed ===`);
    console.log(`Majors processed: ${completedMajors}`);
    console.log(`Successful queries: ${successCount}`);
    console.log(`Success rate: ${(successCount / completedMajors * 100).toFixed(1)}%`);
    console.log(`Total ${universityName} professors in database: ${count}\n`);
    
    return {
      university: universityName,
      majorsProcessed: completedMajors,
      successCount,
      successRate: (successCount / completedMajors * 100).toFixed(1),
      totalProfessors: count,
    };
  } finally {
    await conn.end();
  }
}

export { collectUniversity, parseJSON };
