import { getDb } from './server/db.js';
import { sql } from 'drizzle-orm';

async function compareFields() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }
  
  // 查询华盛顿大学专属领域
  const uwResult = await db.execute(sql`
    SELECT DISTINCT research_field_name 
    FROM university_field_images 
    WHERE university_name LIKE '%Washington%'
    ORDER BY research_field_name
  `);
  const uwFields = uwResult[0].map(row => row.research_field_name);
  
  // 查询通用领域
  const genericResult = await db.execute(sql`
    SELECT DISTINCT field_name 
    FROM research_field_images 
    ORDER BY field_name
  `);
  const genericFields = genericResult[0].map(row => row.field_name);
  
  // 查询mapping表中的领域
  const mappingResult = await db.execute(sql`
    SELECT DISTINCT research_field_name 
    FROM research_field_tag_mapping 
    ORDER BY research_field_name
  `);
  const mappingFields = mappingResult[0].map(row => row.research_field_name);
  
  console.log('=== 领域数量对比 ===');
  console.log(`华盛顿大学专属领域 (university_field_images): ${uwFields.length}`);
  console.log(`通用领域 (research_field_images): ${genericFields.length}`);
  console.log(`映射表领域 (research_field_tag_mapping): ${mappingFields.length}`);
  
  console.log('\n=== 华盛顿大学专属领域（不在通用领域中）===');
  const uwOnly = uwFields.filter(f => !genericFields.includes(f));
  uwOnly.forEach((field, i) => {
    console.log(`${i + 1}. ${field}`);
  });
  
  console.log('\n=== 通用领域（不在华盛顿大学专属领域中）===');
  const genericOnly = genericFields.filter(f => !uwFields.includes(f));
  genericOnly.forEach((field, i) => {
    console.log(`${i + 1}. ${field}`);
  });
  
  console.log('\n=== 映射表领域（不在华盛顿大学专属领域中）===');
  const mappingNotInUW = mappingFields.filter(f => !uwFields.includes(f));
  mappingNotInUW.forEach((field, i) => {
    console.log(`${i + 1}. ${field}`);
  });
  
  console.log('\n=== 华盛顿大学专属领域（不在映射表中）===');
  const uwNotInMapping = uwFields.filter(f => !mappingFields.includes(f));
  uwNotInMapping.forEach((field, i) => {
    console.log(`${i + 1}. ${field}`);
  });
}

compareFields().catch(console.error);
