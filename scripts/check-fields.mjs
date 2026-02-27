import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  "SELECT research_field, COUNT(*) as cnt FROM professors WHERE research_field IS NOT NULL AND research_field != '' GROUP BY research_field ORDER BY cnt DESC"
);
console.log('=== Database research_field values ===');
rows.forEach(r => console.log(`  "${r.research_field}": ${r.cnt}`));
console.log(`\nTotal distinct fields: ${rows.length}`);
await conn.end();
