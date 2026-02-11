/**
 * MIT教授数据收集脚本 - 完整本科专业版
 * 58个本科专业，每个专业3位教授，预计174位教授
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

// MIT本科专业完整列表（58个）
const MIT_UNDERGRADUATE_MAJORS = [
  'Aerospace Engineering',
  'African and African Diaspora Studies',
  'American Studies',
  'Ancient and Medieval Studies',
  'Anthropology',
  'Archaeology and Materials',
  'Architecture',
  'Art and Design',
  'Artificial Intelligence and Decision Making',
  'Asian and Asian Diaspora Studies',
  'Biological Engineering',
  'Biology',
  'Brain and Cognitive Sciences',
  'Business Analytics',
  'Chemical Engineering',
  'Chemical-Biological Engineering',
  'Chemistry',
  'Chemistry and Biology',
  'Civil and Environmental Engineering',
  'Climate System Science and Engineering',
  'Comparative Media Studies',
  'Computation and Cognition',
  'Computer Science and Engineering',
  'Computer Science and Molecular Biology',
  'Data Science',
  'Earth, Atmospheric, and Planetary Sciences',
  'Economics',
  'Electrical Engineering and Computing',
  'Finance',
  'French',
  'German',
  'History',
  'Humanities and Engineering',
  'Humanities and Science',
  'Latin American and Latino/a Studies',
  'Linguistics',
  'Literature',
  'Management',
  'Materials Science and Engineering',
  'Mathematical Economics',
  'Mathematics',
  'Mathematics with Computer Science',
  'Mechanical Engineering',
  'Mechanical and Ocean Engineering',
  'Music',
  'Nuclear Science and Engineering',
  'Philosophy',
  'Physics',
  'Planning',
  'Political Science',
  'Russian and Eurasian Studies',
  'Science, Technology and Society',
  'Spanish',
  'Theater Arts',
  'Urban Science and Planning with Computer Science',
  'Women\'s and Gender Studies',
  'Writing',
];

/**
 * 查询单个专业的教授
 */
async function collectProfessorsForMajor(major) {
  try {
    const prompt = `List exactly 3 renowned professors currently teaching undergraduate courses at MIT in the ${major} major/department. Return ONLY a valid JSON array with no extra text. Format:
[{"name":"Full Name","title":"Professor","department":"${major}","tags":["tag1","tag2","tag3","tag4","tag5"]}]`;

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
      console.error(`[${major}] API Error ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.log(`[${major}] No content`);
      return [];
    }

    // 尝试解析JSON
    let professors = [];
    
    try {
      professors = JSON.parse(content);
      if (Array.isArray(professors) && professors.length > 0) {
        console.log(`[${major}] ✓ ${professors.length} professors`);
      }
    } catch (e) {
      // 尝试正则提取
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          professors = JSON.parse(jsonMatch[0]);
          console.log(`[${major}] ✓ ${professors.length} professors (regex)`);
        } catch (e2) {
          console.log(`[${major}] ✗ Parse failed`);
          return [];
        }
      } else {
        console.log(`[${major}] ✗ No JSON found`);
        return [];
      }
    }

    if (!Array.isArray(professors) || professors.length === 0) {
      return [];
    }

    // 转换为数据库格式，验证数据
    return professors.map(prof => ({
      name: prof.name || 'Unknown',
      university_name: 'MIT',
      department: major || 'Unknown',
      research_field: major || 'Unknown',
      title: prof.title || 'Professor',
      research_areas: prof.tags ? prof.tags.join(', ') : '',
      tags: Array.isArray(prof.tags) ? prof.tags : [],
    })).filter(prof => prof.name !== 'Unknown'); // 过滤无效数据

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
 * 主函数
 */
async function main() {
  console.log(`\n=== Collecting MIT professors (${MIT_UNDERGRADUATE_MAJORS.length} undergraduate majors) ===\n`);

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
  let completedMajors = 0;
  let successCount = 0;

  // 逐个处理专业
  for (const major of MIT_UNDERGRADUATE_MAJORS) {
    console.log(`[${completedMajors + 1}/${MIT_UNDERGRADUATE_MAJORS.length}] ${major}...`);

    const professors = await collectProfessorsForMajor(major);
    
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
    if (completedMajors < MIT_UNDERGRADUATE_MAJORS.length) {
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
    console.log(`Majors processed: ${completedMajors}`);
    console.log(`Successful queries: ${successCount}`);
    console.log(`Success rate: ${(successCount / completedMajors * 100).toFixed(1)}%`);
    console.log(`Total MIT professors in database: ${count}\n`);
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
