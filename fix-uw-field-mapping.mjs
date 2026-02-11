import { getDb } from './server/db.js';
import { sql } from 'drizzle-orm';

/**
 * 为华盛顿大学的31个专属领域创建完整的tag映射
 * 确保所有UW教授都能使用专属领域图
 */
async function fixUWFieldMapping() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }
  
  // 华盛顿大学专属领域到通用领域的映射关系
  const fieldMappings = [
    // 已存在的映射（保持不变）
    { uw: 'AI/Machine Learning', generic: 'AI/Machine Learning' },
    { uw: 'Natural Language Processing', generic: 'Natural Language Processing' },
    { uw: 'Human-Computer Interaction', generic: 'Human-Computer Interaction' },
    { uw: 'Security & Privacy', generic: 'Security & Privacy' },
    { uw: 'Systems', generic: 'Systems' },
    { uw: 'Theory', generic: 'Theory' },
    { uw: 'Robotics', generic: 'Robotics' },
    { uw: 'Programming Languages', generic: 'Programming Languages' },
    { uw: 'Social Networks', generic: 'Social Networks' },
    { uw: 'Data Science', generic: 'Data Science' },
    { uw: 'Health Informatics', generic: 'Health Informatics' },
    { uw: 'Education Technology', generic: 'Education Technology' },
    { uw: 'Virtual Reality', generic: 'Virtual Reality' },
    { uw: 'Ubiquitous Computing', generic: 'Ubiquitous Computing' },
    { uw: 'Quantum Computing', generic: 'Quantum Computing' },
    
    // 需要添加的新映射
    { uw: 'Bioinformatics', generic: 'Computational Biology & Health Informatics' },
    { uw: 'Biomedical Engineering', generic: 'Health Informatics' },
    { uw: 'Cloud Computing', generic: 'Systems' },
    { uw: 'Cybersecurity', generic: 'Security & Privacy' },
    { uw: 'Database Systems', generic: 'Data Science' },
    { uw: 'Distributed Systems', generic: 'Systems' },
    { uw: 'Environmental Science', generic: 'Environmental Studies' },
    { uw: 'Finance', generic: 'Economics & Finance' },
    { uw: 'Graphics/Visualization', generic: 'Computer Graphics & Extended Reality' },
    { uw: 'Hardware/Architecture', generic: 'Systems' },
    { uw: 'Machine Learning Applications', generic: 'AI/Machine Learning' },
    { uw: 'Mobile Computing', generic: 'Ubiquitous Computing' },
    { uw: 'Networking', generic: 'Systems' },
    { uw: 'Software Engineering', generic: 'Programming Languages' },
    { uw: 'Sustainability', generic: 'Environmental Studies' },
    { uw: 'User Experience', generic: 'Human-Computer Interaction' },
    { uw: 'Web Technologies', generic: 'Systems' },
  ];
  
  console.log('开始更新research_field_tag_mapping表...\n');
  
  // 对于每个华盛顿大学专属领域，查找映射到通用领域的tags，并更新为UW专属领域名
  for (const mapping of fieldMappings) {
    // 查询当前映射到通用领域的tags
    const result = await db.execute(sql`
      SELECT DISTINCT tag 
      FROM research_field_tag_mapping 
      WHERE research_field_name = ${mapping.generic}
    `);
    
    const tags = result[0];
    
    if (tags.length === 0) {
      console.log(`⚠️  ${mapping.generic} 没有找到任何tags`);
      continue;
    }
    
    console.log(`📝 ${mapping.generic} → ${mapping.uw} (${tags.length} tags)`);
    
    // 为每个tag插入新的映射（如果不存在）
    for (const tagRow of tags) {
      const tag = tagRow.tag;
      
      // 检查是否已存在
      const existingResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM research_field_tag_mapping 
        WHERE tag = ${tag} AND research_field_name = ${mapping.uw}
      `);
      
      const exists = existingResult[0][0].count > 0;
      
      if (!exists) {
        // 插入新映射
        await db.execute(sql`
          INSERT INTO research_field_tag_mapping (tag, research_field_name)
          VALUES (${tag}, ${mapping.uw})
        `);
        console.log(`   ✅ 添加: ${tag} → ${mapping.uw}`);
      } else {
        console.log(`   ⏭️  跳过: ${tag} → ${mapping.uw} (已存在)`);
      }
    }
  }
  
  console.log('\n✅ 更新完成！');
  
  // 验证结果
  const finalResult = await db.execute(sql`
    SELECT DISTINCT research_field_name 
    FROM research_field_tag_mapping 
    ORDER BY research_field_name
  `);
  
  const finalRows = finalResult[0];
  console.log(`\n最终research_field_tag_mapping表中的研究领域数量: ${finalRows.length}`);
}

fixUWFieldMapping().catch(console.error);
