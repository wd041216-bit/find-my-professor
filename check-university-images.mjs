import { getDb } from './server/db.js';
import { sql } from 'drizzle-orm';

async function checkUniversityFieldImages() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }
  
  // 查询华盛顿大学的专属领域图
  const result = await db.execute(sql`
    SELECT university_name, research_field_name, image_url 
    FROM university_field_images 
    WHERE university_name LIKE '%Washington%'
    ORDER BY research_field_name
  `);
  
  const rows = result[0];
  console.log('华盛顿大学专属领域图数量:', rows.length);
  console.log('\n领域列表:');
  rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.research_field_name}`);
  });
  
  // 查询通用领域图
  const genericResult = await db.execute(sql`
    SELECT field_name FROM research_field_images ORDER BY field_name
  `);
  const genericRows = genericResult[0];
  console.log('\n\n通用领域图数量:', genericRows.length);
  console.log('\n通用领域列表:');
  genericRows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.field_name}`);
  });
}

checkUniversityFieldImages().catch(console.error);
