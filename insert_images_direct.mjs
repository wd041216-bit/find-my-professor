import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const records = JSON.parse(fs.readFileSync('/home/ubuntu/prof_collection/image_cdn_urls.json', 'utf8'));
console.log(`Records to insert: ${records.length}`);

let success = 0, skipped = 0, failed = 0;

for (const { university_name, research_field, image_url } of records) {
  try {
    // Check if already exists
    const [existing] = await conn.query(
      'SELECT id FROM university_field_images WHERE university_name = ? AND research_field_name = ? LIMIT 1',
      [university_name, research_field]
    );
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    // Insert into university_field_images
    await conn.query(
      'INSERT INTO university_field_images (university_name, research_field_name, image_url) VALUES (?, ?, ?)',
      [university_name, research_field, image_url]
    );

    // Update professors without image for this university+field
    await conn.query(
      'UPDATE professors SET image_url = ? WHERE university_name = ? AND research_field = ? AND (image_url IS NULL OR image_url = "")',
      [image_url, university_name, research_field]
    );

    success++;
  } catch (err) {
    failed++;
    if (failed <= 3) console.error(`Failed ${university_name} ${research_field}: ${err.message.substring(0, 80)}`);
  }
}

console.log(`\nResults: ${success} inserted, ${skipped} skipped, ${failed} failed`);

// Final counts
const [imgCount] = await conn.query('SELECT COUNT(*) as cnt FROM university_field_images');
console.log(`Total images in DB: ${imgCount[0].cnt}`);

const [profWithImg] = await conn.query('SELECT COUNT(*) as cnt FROM professors WHERE image_url IS NOT NULL AND image_url != ""');
const [profTotal] = await conn.query('SELECT COUNT(*) as cnt FROM professors');
console.log(`Professors with images: ${profWithImg[0].cnt} / ${profTotal[0].cnt}`);

// Show new universities image counts
const newUnis = ['University of Oxford','University of Cambridge','Imperial College London','ETH Zurich','University College London','University of Edinburgh','National University of Singapore','Peking University','Tsinghua University','University of Sydney','Seoul National University','University of Tokyo','Technical University of Munich','Delft University of Technology','University of Hong Kong',"King's College London",'University of Manchester','New York University'];
console.log('\nNew university image counts:');
for (const uni of newUnis) {
  const [r] = await conn.query('SELECT COUNT(*) as cnt FROM university_field_images WHERE university_name = ?', [uni]);
  if (r[0].cnt > 0) console.log(`  ${uni}: ${r[0].cnt}`);
}

await conn.end();
console.log('\nDone!');
