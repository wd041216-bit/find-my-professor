import mysql from 'mysql2/promise';
import 'dotenv/config';

/**
 * 修复research_field_tag_mapping表中的字段名，使其与university_field_images表一致
 */

const fieldNameMapping = {
  // research_field_tag_mapping -> university_field_images
  'AI & Machine Learning': 'AI/Machine Learning',
  'Information Retrieval & NLP': 'Natural Language Processing',
  'Privacy & Security': 'Security & Privacy',
  'Systems & Architecture': 'Systems',
  'Computer Graphics & Extended Reality': 'Virtual Reality',
  'Programming Languages & Software Engineering': 'Programming Languages',
  'Ubiquitous, Mobile & Sensor Systems': 'Ubiquitous Computing',
  'Theoretical Computer Science & Algorithms': 'Theory',
  'Social Computing & Networks': 'Social Networks',
  'Robotics & Computer Vision': 'Robotics',
  'Data Science & Analytics': 'Data Science',
  'Computational Biology & Health Informatics': 'Health Informatics',
  'Human-Computer Interaction': 'Human-Computer Interaction', // 保持不变
  'Education Technology': 'Education Technology', // 保持不变
};

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('开始修复字段名映射...\n');
  
  for (const [oldName, newName] of Object.entries(fieldNameMapping)) {
    console.log(`更新: "${oldName}" -> "${newName}"`);
    
    const [result] = await conn.execute(
      'UPDATE research_field_tag_mapping SET research_field_name = ? WHERE research_field_name = ?',
      [newName, oldName]
    );
    
    console.log(`  影响行数: ${result.affectedRows}`);
  }
  
  console.log('\n✅ 字段名映射修复完成！');
  
  // 验证结果
  console.log('\n验证：查询更新后的字段名...');
  const [rows] = await conn.execute(
    'SELECT DISTINCT research_field_name FROM research_field_tag_mapping ORDER BY research_field_name'
  );
  console.log('更新后的字段名：');
  rows.forEach(row => console.log(`  - ${row.research_field_name}`));
  
  await conn.end();
}

main().catch(console.error);
