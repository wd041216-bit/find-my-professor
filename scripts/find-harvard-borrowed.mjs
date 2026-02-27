import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Find all university+field combos using harvard_images CDN (borrowed images)
const [rows] = await conn.execute(`
  SELECT university_name, research_field_name, image_url 
  FROM university_field_images 
  WHERE image_url LIKE '%cdn.manus.im/harvard_images%'
  ORDER BY university_name, research_field_name
`);

console.log(`Total borrowed harvard_images records: ${rows.length}`);

// Group by university
const byUni = {};
for (const row of rows) {
  if (!byUni[row.university_name]) byUni[row.university_name] = [];
  byUni[row.university_name].push(row.research_field_name);
}

console.log('\nAffected universities:');
for (const [uni, fields] of Object.entries(byUni)) {
  console.log(`  ${uni}: ${fields.length} fields - ${fields.join(', ')}`);
}

// Save to JSON for parallel image generation
import { writeFileSync } from 'fs';
const tasks = [];
for (const [uni, fields] of Object.entries(byUni)) {
  for (const field of fields) {
    tasks.push({ university: uni, field });
  }
}
writeFileSync('/tmp/need-new-images.json', JSON.stringify(tasks, null, 2));
console.log(`\nSaved ${tasks.length} tasks to /tmp/need-new-images.json`);

await conn.end();
