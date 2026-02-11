/**
 * 统一所有教授的research_field分类
 * 应用标准学科分类映射表到数据库
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

// 标准研究领域列表
const STANDARD_RESEARCH_FIELDS = [
  'Computer Science',
  'Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Medicine & Health',
  'Economics',
  'Business & Management',
  'Political Science',
  'Psychology',
  'Sociology & Anthropology',
  'History',
  'Literature & Languages',
  'Philosophy',
  'Arts & Design',
  'Music & Theater',
  'Architecture & Planning',
  'Environmental Science',
  'Education',
];

// 专业名称到标准领域的映射规则
const FIELD_MAPPING = {
  // Computer Science
  'Computer Science': 'Computer Science',
  'Computer Science and Engineering': 'Computer Science',
  'Computer Science and Molecular Biology': 'Computer Science',
  'Data Science': 'Computer Science',
  'Artificial Intelligence and Decision Making': 'Computer Science',
  'Computation and Cognition': 'Computer Science',
  'Mathematics with Computer Science': 'Computer Science',
  'Urban Science and Planning with Computer Science': 'Computer Science',
  'AI & Machine Learning': 'Computer Science',
  'Data Science & Analytics': 'Computer Science',
  'Software Engineering': 'Computer Science',
  'Cybersecurity': 'Computer Science',

  // Engineering
  'Engineering': 'Engineering',
  'Electrical Engineering and Computing': 'Engineering',
  'Mechanical Engineering': 'Engineering',
  'Mechanical and Ocean Engineering': 'Engineering',
  'Aerospace Engineering': 'Engineering',
  'Civil and Environmental Engineering': 'Engineering',
  'Civil Engineering': 'Engineering',
  'Chemical Engineering': 'Engineering',
  'Chemical-Biological Engineering': 'Engineering',
  'Biological Engineering': 'Engineering',
  'Biomedical Engineering': 'Engineering',
  'Materials Science and Engineering': 'Engineering',
  'Nuclear Science and Engineering': 'Engineering',
  'Flexible Nuclear Science and Engineering Degree': 'Engineering',
  'Environmental Engineering Science': 'Engineering',
  'Robotics': 'Engineering',

  // Mathematics
  'Mathematics': 'Mathematics',
  'Mathematical Economics': 'Mathematics',
  'Statistics and Data Science': 'Mathematics',
  'Applied Mathematics': 'Mathematics',

  // Physics
  'Physics': 'Physics',
  'Astronomy': 'Physics',

  // Chemistry
  'Chemistry': 'Chemistry',
  'Chemistry and Biology': 'Chemistry',
  'Atmospheric Chemistry': 'Chemistry',

  // Biology
  'Biology': 'Biology',

  // Medicine & Health
  'Brain and Cognitive Sciences': 'Medicine & Health',
  'Toxicology and Environmental Health': 'Medicine & Health',

  // Economics
  'Economics': 'Economics',
  'Finance': 'Economics',

  // Business & Management
  'Business Analytics': 'Business & Management',
  'Management': 'Business & Management',
  'Entrepreneurship & Innovation': 'Business & Management',

  // Political Science
  'Political Science': 'Political Science',
  'Public Policy': 'Political Science',
  'Applied Inter­national Studies': 'Political Science',

  // Psychology
  'Psychology': 'Psychology',

  // Sociology & Anthropology
  'Anthropology': 'Sociology & Anthropology',
  'Sociology': 'Sociology & Anthropology',
  'Women\'s and Gender Studies': 'Sociology & Anthropology',
  'African and African Diaspora Studies': 'Sociology & Anthropology',
  'Asian and Asian Diaspora Studies': 'Sociology & Anthropology',
  'Latin American and Latino/a Studies': 'Sociology & Anthropology',
  'Middle Eastern Studies': 'Sociology & Anthropology',
  'Russian and Eurasian Studies': 'Sociology & Anthropology',

  // History
  'History': 'History',
  'American Studies': 'History',
  'Ancient and Medieval Studies': 'History',
  'Archaeology and Materials': 'History',

  // Literature & Languages
  'Literature': 'Literature & Languages',
  'Linguistics': 'Literature & Languages',
  'Writing': 'Literature & Languages',
  'Comparative Media Studies': 'Literature & Languages',
  'Chinese': 'Literature & Languages',
  'French': 'Literature & Languages',
  'German': 'Literature & Languages',
  'Japanese': 'Literature & Languages',
  'Spanish': 'Literature & Languages',

  // Philosophy
  'Philosophy': 'Philosophy',
  'Science, Technology and Society': 'Philosophy',

  // Arts & Design
  'Art and Design': 'Arts & Design',
  'Design': 'Arts & Design',
  'Art, Culture and Technology': 'Arts & Design',

  // Music & Theater
  'Music': 'Music & Theater',
  'Theater Arts': 'Music & Theater',

  // Architecture & Planning
  'Architecture': 'Architecture & Planning',
  'Planning': 'Architecture & Planning',
  'International Development': 'Architecture & Planning',

  // Environmental Science
  'Earth, Atmospheric, and Planetary Sciences': 'Environmental Science',
  'Climate System Science and Engineering': 'Environmental Science',
  'Environment and Sustainability': 'Environmental Science',
  'Energy Studies': 'Environmental Science',

  // Education
  'Humanities and Engineering': 'Education',
  'Humanities and Science': 'Education',
};

/**
 * 映射字段名到标准领域（使用关键词匹配）
 */
function mapToStandardField(fieldName) {
  if (!fieldName) return 'Computer Science';

  // 1. 直接匹配
  if (fieldName in FIELD_MAPPING) {
    return FIELD_MAPPING[fieldName];
  }

  // 2. 关键词匹配
  const lower = fieldName.toLowerCase();

  if (lower.includes('computer') || lower.includes('software') || 
      lower.includes('data science') || lower.includes('artificial intelligence') ||
      lower.includes('machine learning') || lower.includes('ai') ||
      lower.includes('cybersecurity')) {
    return 'Computer Science';
  }

  if (lower.includes('engineering') || lower.includes('mechanical') ||
      lower.includes('electrical') || lower.includes('aerospace') ||
      lower.includes('civil') || lower.includes('chemical') ||
      lower.includes('materials') || lower.includes('robotics')) {
    return 'Engineering';
  }

  if (lower.includes('math') || lower.includes('statistics')) {
    return 'Mathematics';
  }

  if (lower.includes('physics') || lower.includes('astronomy') ||
      lower.includes('quantum')) {
    return 'Physics';
  }

  if (lower.includes('chemistry') || lower.includes('chemical')) {
    return 'Chemistry';
  }

  if (lower.includes('biology') || lower.includes('bio') ||
      lower.includes('genetics') || lower.includes('molecular') ||
      lower.includes('neuroscience')) {
    return 'Biology';
  }

  if (lower.includes('medicine') || lower.includes('health') ||
      lower.includes('cognitive') || lower.includes('brain') ||
      lower.includes('medical')) {
    return 'Medicine & Health';
  }

  if (lower.includes('economics') || lower.includes('finance')) {
    return 'Economics';
  }

  if (lower.includes('business') || lower.includes('management') ||
      lower.includes('entrepreneurship')) {
    return 'Business & Management';
  }

  if (lower.includes('political') || lower.includes('policy') ||
      lower.includes('government')) {
    return 'Political Science';
  }

  if (lower.includes('psychology')) {
    return 'Psychology';
  }

  if (lower.includes('sociology') || lower.includes('anthropology') ||
      lower.includes('social') || lower.includes('gender') ||
      lower.includes('cultural')) {
    return 'Sociology & Anthropology';
  }

  if (lower.includes('history') || lower.includes('historical') ||
      lower.includes('archaeology')) {
    return 'History';
  }

  if (lower.includes('literature') || lower.includes('language') ||
      lower.includes('linguistics') || lower.includes('writing') ||
      lower.includes('english') || lower.includes('french') ||
      lower.includes('spanish') || lower.includes('chinese')) {
    return 'Literature & Languages';
  }

  if (lower.includes('philosophy') || lower.includes('ethics')) {
    return 'Philosophy';
  }

  if (lower.includes('art') || lower.includes('design') ||
      lower.includes('visual')) {
    return 'Arts & Design';
  }

  if (lower.includes('music') || lower.includes('theater') ||
      lower.includes('theatre') || lower.includes('performing')) {
    return 'Music & Theater';
  }

  if (lower.includes('architecture') || lower.includes('planning') ||
      lower.includes('urban')) {
    return 'Architecture & Planning';
  }

  if (lower.includes('environmental') || lower.includes('climate') ||
      lower.includes('earth') || lower.includes('atmospheric') ||
      lower.includes('sustainability')) {
    return 'Environmental Science';
  }

  if (lower.includes('education') || lower.includes('teaching')) {
    return 'Education';
  }

  // 默认
  return 'Computer Science';
}

/**
 * 主函数
 */
async function main() {
  console.log('\n=== Unifying research_field classifications ===\n');

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // 1. 获取所有不同的research_field值
    const [fields] = await connection.execute(
      'SELECT DISTINCT research_field, COUNT(*) as count FROM professors GROUP BY research_field'
    );

    console.log(`Found ${fields.length} unique research_field values\n`);

    // 2. 创建映射统计
    const mappingStats = new Map();
    const mappings = [];

    fields.forEach(row => {
      const originalField = row.research_field;
      const standardField = mapToStandardField(originalField);
      
      mappings.push({ original: originalField, standard: standardField, count: row.count });

      if (!mappingStats.has(standardField)) {
        mappingStats.set(standardField, 0);
      }
      mappingStats.set(standardField, mappingStats.get(standardField) + row.count);
    });

    // 3. 显示映射预览
    console.log('Mapping preview (top 30):');
    mappings.slice(0, 30).forEach(m => {
      console.log(`  "${m.original}" (${m.count}) → "${m.standard}"`);
    });
    console.log(`  ... and ${Math.max(0, mappings.length - 30)} more\n`);

    // 4. 显示标准字段分布
    console.log('Standard field distribution:');
    const sortedStats = Array.from(mappingStats.entries())
      .sort((a, b) => b[1] - a[1]);
    sortedStats.forEach(([field, count]) => {
      console.log(`  ${field}: ${count}`);
    });
    console.log();

    // 5. 执行更新
    console.log('Updating database...\n');
    let updatedCount = 0;

    for (const mapping of mappings) {
      const [result] = await connection.execute(
        'UPDATE professors SET research_field = ? WHERE research_field = ?',
        [mapping.standard, mapping.original]
      );
      updatedCount += result.affectedRows;
      
      if (result.affectedRows > 0) {
        console.log(`  Updated ${result.affectedRows} professors: "${mapping.original}" → "${mapping.standard}"`);
      }
    }

    // 6. 验证结果
    const [newFields] = await connection.execute(
      'SELECT DISTINCT research_field, COUNT(*) as count FROM professors GROUP BY research_field ORDER BY count DESC'
    );

    console.log(`\n=== Update completed ===`);
    console.log(`Total professors updated: ${updatedCount}`);
    console.log(`Unique research_field values: ${fields.length} → ${newFields.length}\n`);

    console.log('Final research_field distribution:');
    newFields.forEach(row => {
      console.log(`  ${row.research_field}: ${row.count}`);
    });

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
