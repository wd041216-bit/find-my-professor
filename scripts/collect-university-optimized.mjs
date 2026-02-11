/**
 * 优化版大学教授数据收集脚本
 * 减少token消耗：简化prompt，批量处理
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const API_URL = process.env.BUILT_IN_FORGE_API_URL;
const API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// 从命令行参数获取大学名称
const universityName = process.argv[2];

if (!universityName) {
  console.error('Usage: node collect-university-optimized.mjs "<University Name>"');
  console.error('Example: node collect-university-optimized.mjs "MIT"');
  process.exit(1);
}

// 主要专业列表（简化版，减少API调用次数）
const DEPARTMENTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Economics',
  'Psychology',
  'Political Science',
  'History',
  'English',
  'Philosophy',
  'Sociology',
  'Business',
  'Statistics',
  'Materials Science',
  'Aerospace Engineering',
  'Chemical Engineering',
  'Civil Engineering',
];

/**
 * 调用LLM API收集教授信息
 */
async function collectProfessorsForDepartment(university, department) {
  try {
    // 优化的prompt：直接要求tags，减少token消耗
    const prompt = `List exactly 3 most renowned professors from ${university} ${department} department. For each professor, provide: name, title, and 5-8 research tags (keywords like "machine learning", "quantum computing", etc.). Format as JSON array: [{"name":"...","title":"...","tags":["tag1","tag2",...]}]`;

    const response = await fetch(`${API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 使用更便宜的模型
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // 降低temperature减少随机性
        max_tokens: 500, // 限制token数量
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Error] ${response.status}: ${errorText}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.log(`[${department}] No content returned`);
      return [];
    }

    // 解析JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`[${department}] No JSON array found in response`);
      return [];
    }

    const professors = JSON.parse(jsonMatch[0]);

    // 转换为数据库格式
    return professors.map(prof => ({
      name: prof.name,
      university_name: university,
      department: department,
      research_field: department, // 使用department作为research_field
      title: prof.title || 'Professor',
      research_areas: prof.tags ? prof.tags.join(', ') : '', // 将tags转换为research_areas字符串
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

    console.log(`[Database] Saved ${professors.length} professors`);
  } finally {
    await connection.end();
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(`\n=== Collecting professors from ${universityName} ===\n`);

  // 先删除该大学的旧数据
  const connection = await mysql.createConnection(DATABASE_URL);
  try {
    const [result] = await connection.execute(
      'DELETE FROM professors WHERE university_name = ?',
      [universityName]
    );
    console.log(`[Database] Deleted ${result.affectedRows} old records for ${universityName}\n`);
  } finally {
    await connection.end();
  }

  let allProfessors = [];
  let completedDepts = 0;

  for (const dept of DEPARTMENTS) {
    console.log(`[${completedDepts + 1}/${DEPARTMENTS.length}] Collecting ${dept}...`);

    const professors = await collectProfessorsForDepartment(universityName, dept);
    
    if (professors.length > 0) {
      allProfessors.push(...professors);
      console.log(`  ✓ Found ${professors.length} professors`);
    } else {
      console.log(`  ✗ No professors found`);
    }

    completedDepts++;

    // 每收集5个专业保存一次
    if (allProfessors.length >= 15) {
      await saveProfessorsToDatabase(allProfessors);
      allProfessors = [];
    }

    // 延迟2秒避免速率限制
    if (completedDepts < DEPARTMENTS.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 保存剩余的教授
  if (allProfessors.length > 0) {
    await saveProfessorsToDatabase(allProfessors);
  }

  console.log(`\n=== Collection completed for ${universityName} ===`);
  console.log(`Total departments processed: ${completedDepts}`);
}

main().catch(console.error);
