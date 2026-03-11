import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

async function runSqlFile(filepath, label) {
  const sql = fs.readFileSync(filepath, 'utf8');
  // Split on semicolons but keep batches together (each INSERT is one statement)
  const statements = sql
    .split(/;\s*\n\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`\n${label}: ${statements.length} statements`);
  let success = 0, failed = 0;
  
  for (const stmt of statements) {
    try {
      const [result] = await conn.query(stmt + ';');
      success++;
      process.stdout.write('.');
    } catch (err) {
      failed++;
      console.error(`\nFailed: ${err.message.substring(0, 100)}`);
    }
  }
  console.log(`\n  Success: ${success}, Failed: ${failed}`);
}

try {
  await runSqlFile('/home/ubuntu/prof_collection/insert_professors.sql', 'Inserting professors');
  await runSqlFile('/home/ubuntu/prof_collection/insert_tags.sql', 'Inserting tags');
  
  // Verify counts
  const [profRows] = await conn.query('SELECT COUNT(*) as cnt FROM professors');
  console.log(`\nTotal professors in DB: ${profRows[0].cnt}`);
  
  const [tagRows] = await conn.query('SELECT COUNT(*) as cnt FROM research_tags_dictionary');
  console.log(`Total tags in dictionary: ${tagRows[0].cnt}`);
  
  const [uniRows] = await conn.query('SELECT university_name, COUNT(*) as cnt FROM professors GROUP BY university_name ORDER BY cnt DESC');
  console.log('\nProfessors by university:');
  uniRows.forEach(r => console.log(`  ${r.university_name}: ${r.cnt}`));
  
} finally {
  await conn.end();
}
