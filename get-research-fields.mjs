import { getDb } from './server/db.js';
import { sql } from 'drizzle-orm';

async function getResearchFields() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }
  
  // 查询research_field_images表中的29个领域
  const result = await db.execute(sql`
    SELECT field_name, image_url 
    FROM research_field_images 
    ORDER BY field_name
  `);
  
  const fields = result[0];
  console.log('=== Research Field Images表中的29个领域 ===\n');
  fields.forEach((field, index) => {
    console.log(`${index + 1}. ${field.field_name}`);
  });
  
  console.log('\n=== JSON格式（用于生成图片）===\n');
  console.log(JSON.stringify(fields.map(f => f.field_name), null, 2));
}

getResearchFields().catch(console.error);
