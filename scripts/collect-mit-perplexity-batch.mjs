/**
 * MIT教授数据收集脚本 - 使用Perplexity API（批量查询版）
 * 一次查询2-3个专业，提高效率
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
 * 批量查询多个专业的教授（一次查询2-3个专业）
 */
async function collectProfessorsForDepartmentBatch(departments) {
  try {
    const deptList = departments.join(', ');
    const prompt = `Search the web and list the top 3 most renowned professors currently teaching at MIT in each of these departments: ${deptList}.

For each professor, provide:
- name: Full name
- title: Academic title
- department: Department name
- tags: 5-8 research keywords

Format as JSON array:
[{"name":"...","title":"...","department":"...","tags":["tag1","tag2",...]}]`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Error] ${response.status}: ${errorText.substring(0, 200)}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.log(`[${deptList}] No content returned`);
      return [];
    }

    // 解析JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`[${deptList}] No JSON array found`);
      return [];
    }

    const professors = JSON.parse(jsonMatch[0]);

    // 转换为数据库格式
    return professors.map(prof => ({
      name: prof.name,
      university_name: 'MIT',
      department: prof.department,
      research_field: prof.department,
      title: prof.title || 'Professor',
      research_areas: prof.tags ? prof.tags.join(', ') : '',
      tags: Array.isArray(prof.tags) ? prof.tags : [],
    }));

  } catch (error) {
    console.error(`[${departments.join(', ')}] Error:`, error.message);
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

    console.log(`[Database] Saved ${professors.length} professors`);
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
  const BATCH_SIZE = 3; // 一次查询3个专业

  // 分批处理专业
  for (let i = 0; i < MIT_DEPARTMENTS.length; i += BATCH_SIZE) {
    const batch = MIT_DEPARTMENTS.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(MIT_DEPARTMENTS.length / BATCH_SIZE);
    
    console.log(`[Batch ${batchNum}/${totalBatches}] Collecting: ${batch.join(', ')}...`);

    const professors = await collectProfessorsForDepartmentBatch(batch);
    
    if (professors.length > 0) {
      allProfessors.push(...professors);
      console.log(`  ✓ Found ${professors.length} professors`);
    } else {
      console.log(`  ✗ No professors found`);
    }

    completedDepts += batch.length;

    // 每收集15个教授保存一次
    if (allProfessors.length >= 15) {
      await saveProfessorsToDatabase(allProfessors);
      allProfessors = [];
    }

    // 延迟3秒避免速率限制
    if (i + BATCH_SIZE < MIT_DEPARTMENTS.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
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
    console.log(`Total departments processed: ${completedDepts}`);
    console.log(`Total MIT professors in database: ${count}\n`);
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
