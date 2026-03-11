import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const professors = JSON.parse(fs.readFileSync('/home/ubuntu/prof_collection/filtered_professors.json', 'utf8'));
console.log(`Professors to insert: ${professors.length}`);

const newTags = JSON.parse(fs.readFileSync('/home/ubuntu/prof_collection/new_tags.json', 'utf8'));
console.log(`New tags to process: ${Object.keys(newTags).length}`);

let profSuccess = 0, profFailed = 0, profSkipped = 0;

for (const prof of professors) {
  try {
    const name = prof.name || '';
    const title = prof.title || 'Professor';
    const department = prof.department || '';
    const university_name = prof.university_name || '';
    const research_field = prof.research_field || 'Other';
    const tagsRaw = prof.tags || '';
    const tagsArray = tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const research_areas = tagsArray.join(', ');

    const [existing] = await conn.query(
      'SELECT id FROM professors WHERE name = ? AND university_name = ? LIMIT 1',
      [name, university_name]
    );
    if (existing.length > 0) { profSkipped++; continue; }

    await conn.query(
      `INSERT INTO professors (name, title, department, university_name, research_field, tags, research_areas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, title, department, university_name, research_field, JSON.stringify(tagsArray), research_areas]
    );
    profSuccess++;
    if (profSuccess % 100 === 0) process.stdout.write(`  Inserted ${profSuccess}...\n`);
  } catch (err) {
    profFailed++;
    if (profFailed <= 3) console.error(`Failed ${prof.name}: ${err.message.substring(0,80)}`);
  }
}

console.log(`\nProfessors: ${profSuccess} inserted, ${profSkipped} skipped, ${profFailed} failed`);

let tagSuccess = 0, tagSkipped = 0;
for (const [tag, researchField] of Object.entries(newTags)) {
  try {
    await conn.query(
      `INSERT IGNORE INTO research_tags_dictionary (tag, category, frequency, university_name, major_name) VALUES (?, ?, 1, 'Multiple', 'Multiple')`,
      [tag, researchField]
    );
    tagSuccess++;
  } catch (err) { tagSkipped++; }
}
console.log(`Tags: ${tagSuccess} inserted, ${tagSkipped} skipped`);

const [pc] = await conn.query('SELECT COUNT(*) as cnt FROM professors');
const [tc] = await conn.query('SELECT COUNT(*) as cnt FROM research_tags_dictionary');
console.log(`\nTotal professors: ${pc[0].cnt}`);
console.log(`Total tags: ${tc[0].cnt}`);

const [uniRows] = await conn.query('SELECT university_name, COUNT(*) as cnt FROM professors GROUP BY university_name ORDER BY cnt DESC');
console.log('\nAll universities:');
uniRows.forEach(r => console.log(`  ${r.university_name}: ${r.cnt}`));

await conn.end();
