import { getDb } from './server/db.js';
import { sql } from 'drizzle-orm';

async function checkTagMapping() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }
  
  // 查询research_field_tag_mapping表中的研究领域
  const result = await db.execute(sql`
    SELECT DISTINCT research_field_name 
    FROM research_field_tag_mapping 
    ORDER BY research_field_name
  `);
  
  const rows = result[0];
  console.log('research_field_tag_mapping表中的研究领域数量:', rows.length);
  console.log('\n领域列表:');
  rows.forEach((row, i) => {
    console.log(`${i+1}. ${row.research_field_name}`);
  });
}

checkTagMapping().catch(console.error);
