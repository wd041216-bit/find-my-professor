/**
 * MIT教授数据收集脚本 - 使用Perplexity API（联网LLM）
 * 直接让LLM搜索MIT所有专业的顶尖教授
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

/**
 * 调用Perplexity API收集MIT所有专业的教授信息
 */
async function collectMITProfessors() {
  try {
    const prompt = `Search the web and list ALL major departments/schools at MIT (Massachusetts Institute of Technology). For each department, list the top 3 most renowned professors currently teaching there. 

For each professor, provide:
- name: Full name
- title: Academic title (e.g., "Professor", "Associate Professor")
- department: Department/School name
- tags: 5-8 research keywords (e.g., ["machine learning", "robotics", "computer vision"])

Format the response as a JSON array:
[
  {
    "name": "...",
    "title": "...",
    "department": "...",
    "tags": ["tag1", "tag2", ...]
  },
  ...
]

Include ALL departments at MIT (Computer Science, Mathematics, Physics, Chemistry, Biology, Mechanical Engineering, Electrical Engineering, Economics, Business, Architecture, etc.). Aim for at least 200-300 professors total.`;

    console.log('[Perplexity] Sending request to collect MIT professors...\n');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online', // 联网模型
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 8000, // 需要大量token来返回所有教授
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Perplexity Error] ${response.status}: ${errorText}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.log('[Perplexity] No content returned');
      return [];
    }

    console.log('[Perplexity] Response received, parsing JSON...\n');

    // 解析JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('[Perplexity] No JSON array found in response');
      console.log('Response content:', content.substring(0, 500));
      return [];
    }

    const professors = JSON.parse(jsonMatch[0]);
    console.log(`[Perplexity] Successfully parsed ${professors.length} professors\n`);

    // 转换为数据库格式
    return professors.map(prof => ({
      name: prof.name,
      university_name: 'MIT',
      department: prof.department,
      research_field: prof.department, // 使用department作为research_field
      title: prof.title || 'Professor',
      research_areas: prof.tags ? prof.tags.join(', ') : '',
      tags: Array.isArray(prof.tags) ? prof.tags : [],
    }));

  } catch (error) {
    console.error('[Perplexity] Error:', error.message);
    return [];
  }
}

/**
 * 批量保存教授到数据库
 */
async function saveProfessorsToDatabase(professors) {
  if (professors.length === 0) {
    console.log('[Database] No professors to save');
    return;
  }

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log(`[Database] Saving ${professors.length} professors to database...\n`);

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

    console.log(`[Database] ✓ Successfully saved ${professors.length} professors\n`);
  } catch (error) {
    console.error('[Database] Error saving professors:', error.message);
  } finally {
    await connection.end();
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('\n=== Collecting MIT professors using Perplexity API (Online LLM) ===\n');

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

  // 使用Perplexity API收集所有MIT教授
  const professors = await collectMITProfessors();

  if (professors.length === 0) {
    console.log('\n[Error] No professors collected. Please check the API response.\n');
    process.exit(1);
  }

  // 保存到数据库
  await saveProfessorsToDatabase(professors);

  // 统计结果
  const conn = await mysql.createConnection(DATABASE_URL);
  try {
    const [result] = await conn.execute(
      'SELECT COUNT(*) as count FROM professors WHERE university_name = ?',
      ['MIT']
    );
    const count = result[0].count;
    console.log(`\n=== Collection completed ===`);
    console.log(`Total MIT professors in database: ${count}\n`);
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
