#!/usr/bin/env node

/**
 * 通用大学教授数据收集脚本
 * 
 * 使用方法：
 *   node collect-university-generic.mjs "Harvard University"
 *   node collect-university-generic.mjs "Stanford University"
 *   node collect-university-generic.mjs "Yale University"
 * 
 * 流程：
 * 1. 搜索大学的本科专业列表
 * 2. 为每个专业收集3位教授
 * 3. 标准化研究领域
 * 4. 保存到数据库
 */

import fetch from 'node-fetch';
import { createConnection } from 'mysql2/promise';
import { sleep } from './utils.mjs';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'find_my_professor'
};

// 标准研究领域映射
const RESEARCH_FIELD_MAPPING = {
  '计算机科学': ['计算机', '计算', '软件', '编程', 'ai', '机器学习', 'cs'],
  '工程学': ['工程', '机械', '电气', '土木', '化工'],
  '生物学': ['生物', '遗传', '分子'],
  '物理学': ['物理', '量子', '天体'],
  '数学': ['数学', '统计', '应用数学'],
  '化学': ['化学', '有机', '无机'],
  '医学与健康': ['医学', '健康', '护理', '药学'],
  '经济学': ['经济', '金融', '商业'],
  '政治学': ['政治', '国际关系', '公共政策'],
  '社会学与人类学': ['社会学', '人类学', '社会'],
  '历史学': ['历史', '考古'],
  '文学与语言': ['文学', '语言', '英文', '中文'],
  '哲学': ['哲学', '伦理'],
  '建筑与规划': ['建筑', '规划', '城市设计'],
  '艺术与设计': ['艺术', '设计', '美术'],
  '商业与管理': ['商业', '管理', '企业'],
  '教育学': ['教育', '教学'],
  '环境科学': ['环境', '生态', '可持续'],
  '音乐与戏剧': ['音乐', '戏剧', '表演']
};

// 5层JSON解析策略
function parseJSON(text) {
  // 第1层：直接JSON.parse
  try {
    return JSON.parse(text);
  } catch (e) {}

  // 第2层：从markdown代码块中提取JSON
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch (e) {}
  }

  // 第3层：查找第一个{到最后一个}
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    try {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    } catch (e) {}
  }

  // 第4层：修复常见JSON错误
  let fixed = text
    .replace(/'/g, '"')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/\n/g, ' ');
  try {
    return JSON.parse(fixed);
  } catch (e) {}

  // 第5层：逐行解析
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('{')) {
      try {
        return JSON.parse(line);
      } catch (e) {}
    }
  }

  throw new Error('Failed to parse JSON after 5 attempts');
}

// 标准化研究领域
function normalizeResearchField(rawField) {
  const lower = rawField.toLowerCase();
  
  for (const [standard, keywords] of Object.entries(RESEARCH_FIELD_MAPPING)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return standard;
    }
  }
  
  return rawField;
}

// 验证教授数据
function validateProfessor(prof) {
  const required = ['name', 'email', 'title', 'department', 'research_field'];
  for (const field of required) {
    const value = prof[field];
    if (!value || value === 'undefined' || value === 'null' || value.trim() === '') {
      return false;
    }
  }
  return true;
}

// 搜索大学本科专业
async function fetchUniversityMajors(universityName) {
  console.log(`\n[${universityName}] 搜索本科专业列表...`);
  
  const prompt = `请列出${universityName}的所有本科专业（仅本科，不包括研究生或博士专业）。
  
  返回JSON格式，包含"majors"数组，每个专业是字符串。
  例如: {"majors": ["计算机科学", "生物学", "工程学"]}
  
  请确保返回有效的JSON。`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = parseJSON(content);
    
    console.log(`✓ 找到 ${parsed.majors.length} 个本科专业`);
    return parsed.majors;
  } catch (error) {
    console.error(`✗ 搜索专业列表失败:`, error.message);
    return [];
  }
}

// 收集单个专业的教授
async function fetchProfessorsForMajor(universityName, major) {
  const prompt = `请查找${universityName}中教授${major}的3位教授。
  
  返回JSON格式，包含"professors"数组，每个教授包含：
  - name: 教授全名
  - email: 邮箱地址
  - title: 学术头衔（如Professor, Associate Professor）
  - department: 所属部门
  - research_field: 研究领域
  - tags: 逗号分隔的研究关键词（可选）
  
  例如:
  {
    "professors": [
      {
        "name": "John Smith",
        "email": "john.smith@university.edu",
        "title": "Professor",
        "department": "Computer Science",
        "research_field": "Machine Learning",
        "tags": "AI, Deep Learning, Neural Networks"
      }
    ]
  }
  
  请确保返回有效的JSON。`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = parseJSON(content);
    
    return parsed.professors || [];
  } catch (error) {
    console.error(`  ✗ 收集${major}失败:`, error.message);
    return [];
  }
}

// 保存教授到数据库
async function saveProfessors(connection, universityName, professors) {
  let saved = 0;
  let failed = 0;

  for (const prof of professors) {
    if (!validateProfessor(prof)) {
      console.log(`  ⊘ 跳过无效数据: ${prof.name || 'unknown'}`);
      failed++;
      continue;
    }

    const normalizedField = normalizeResearchField(prof.research_field);

    try {
      await connection.execute(
        `INSERT INTO professors 
         (name, email, title, department, university_name, research_field, tags) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          prof.name,
          prof.email,
          prof.title,
          prof.department,
          universityName,
          normalizedField,
          prof.tags || ''
        ]
      );
      saved++;
    } catch (error) {
      console.error(`  ✗ 保存失败 ${prof.name}:`, error.message);
      failed++;
    }
  }

  return { saved, failed };
}

// 主函数
async function main() {
  const universityName = process.argv[2];

  if (!universityName) {
    console.error('使用方法: node collect-university-generic.mjs "University Name"');
    process.exit(1);
  }

  if (!PERPLEXITY_API_KEY) {
    console.error('错误: PERPLEXITY_API_KEY 环境变量未设置');
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`开始收集 ${universityName} 的教授数据`);
  console.log(`========================================`);

  let connection;
  try {
    // 连接数据库
    connection = await createConnection(DB_CONFIG);
    console.log('✓ 数据库连接成功');

    // 搜索专业列表
    const majors = await fetchUniversityMajors(universityName);
    if (majors.length === 0) {
      console.error('✗ 无法获取专业列表');
      process.exit(1);
    }

    // 收集教授
    let totalSaved = 0;
    let totalFailed = 0;

    for (let i = 0; i < majors.length; i++) {
      const major = majors[i];
      console.log(`\n[${i + 1}/${majors.length}] 收集 ${major} 的教授...`);

      const professors = await fetchProfessorsForMajor(universityName, major);
      
      if (professors.length > 0) {
        const { saved, failed } = await saveProfessors(connection, universityName, professors);
        console.log(`  ✓ 保存 ${saved} 位教授${failed > 0 ? `，失败 ${failed}` : ''}`);
        totalSaved += saved;
        totalFailed += failed;
      } else {
        console.log(`  ⊘ 未找到教授`);
      }

      // 速率限制
      await sleep(2000);
    }

    // 统计
    console.log(`\n========================================`);
    console.log(`收集完成！`);
    console.log(`总计: ${totalSaved} 位教授保存成功，${totalFailed} 位失败`);
    console.log(`成功率: ${((totalSaved / (totalSaved + totalFailed)) * 100).toFixed(1)}%`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
