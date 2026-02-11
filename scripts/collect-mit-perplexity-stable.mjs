/**
 * MIT教授数据收集脚本 - 使用Perplexity API（稳定版）
 * 一次查询1个专业，每个专业3位教授
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!PERPLEXITY_API_KEY) {
  console.error('Error: PERPLEXITY_API_KEY not found in environment variables');
  process.exit(1);
}

// MIT主要专业列表（扩展版）
const MIT_DEPARTMENTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Aerospace Engineering',
  'Materials Science',
  'Economics',
  'Business (Sloan School)',
  'Political Science',
  'Psychology',
  'Brain and Cognitive Sciences',
  'Linguistics',
  'Philosophy',
  'History',
  'Literature',
  'Architecture',
  'Urban Planning',
  'Media Arts and Sciences',
  'Nuclear Science and Engineering',
  'Environmental Engineering',
  'Biological Engineering',
  'Statistics',
  'Operations Research',
  'Management Science',
  'Finance',
];

/**
 * 查询单个专业的教授
 */
async function collectProfessorsForDepartment(department) {
  try {
    const prompt = `List exactly 3 most renowned professors currently teaching at MIT in the ${department} department. Return ONLY a JSON array with no additional text. Format:
[{"name":"Full Name","title":"Professor/Associate Professor","department":"${department}","tags":["tag1","tag2","tag3","tag4","tag5"]}]`;

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
      const errorText = await response.text();
      console.error(`[${department}] API Error ${response.status}: ${errorText.substring(0, 150)}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.log(`[${department}] No content returned`);
      return [];
    }

    // 尝试多种方式提取JSON
    let professors = [];
    
    // 方法1: 直接解析（如果返回纯JSON）
    try {
      professors = JSON.parse(content);
      if (Array.isArray(professors)) {
        console.log(`[${department}] ✓ Parsed ${professors.length} professors (direct parse)`);
      }
    } catch (e) {
      // 方法2: 提取JSON数组
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          professors = JSON.parse(jsonMatch[0]);
          console.log(`[${department}] ✓ Parsed ${professors.length} professors (regex extract)`);
        } catch (e2) {
          console.log(`[${department}] ✗ JSON parse failed: ${e2.message}`);
          return [];
        }
      } else {
        console.log(`[${department}] ✗ No JSON array found in response`);
        return [];
      }
    }

    if (!Array.isArray(professors) || professors.length === 0) {
      console.log(`[${department}] ✗ Invalid or empty result`);
      return [];
    }

    // 转换为数据库格式
    return professors.map(prof => ({
      name: prof.name,
      university_name: 'MIT',
      department: department,
      research_field: department,
      title: prof.title || 'Professor',
      research_areas: prof.tags ? prof.tags.join(', ') : '',
      tags: Array.isArray(prof.tags) ? prof.tags : [],
    }));

  } catch (error) {
    console.error(`[${department}] Error:`, error.message);
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

    console.log(`[Database] Saved ${professors.length} professors\n`);
  } finally {
    await connection.end();
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(`\n=== Collecting MIT professors (${MIT_DEPARTMENTS.length} departments) ===\n`);

  // 先删除MIT的旧数据
  const connection = await mysql.createConnection(DATABASE_URL);
  try {
    const [result] = await connection.execute(
      'DELETE FROM professors WHERE university_name = ?',
      ['MIT']
    );
    console.log(`[Database] Deleted ${result.affectedRows} old MIT records\n`);
  } finally {
    await connection.end();
  }

  let allProfessors = [];
  let completedDepts = 0;
  let successCount = 0;

  // 逐个处理专业
  for (const dept of MIT_DEPARTMENTS) {
    console.log(`[${completedDepts + 1}/${MIT_DEPARTMENTS.length}] ${dept}...`);

    const professors = await collectProfessorsForDepartment(dept);
    
    if (professors.length > 0) {
      allProfessors.push(...professors);
      successCount++;
    }

    completedDepts++;

    // 每收集15个教授保存一次
    if (allProfessors.length >= 15) {
      await saveProfessorsToDatabase(allProfessors);
      allProfessors = [];
    }

    // 延迟2秒避免速率限制
    if (completedDepts < MIT_DEPARTMENTS.length) {
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
      ['MIT']
    );
    const count = result[0].count;
    console.log(`\n=== Collection completed ===`);
    console.log(`Departments processed: ${completedDepts}`);
    console.log(`Successful queries: ${successCount}`);
    console.log(`Total MIT professors in database: ${count}\n`);
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
