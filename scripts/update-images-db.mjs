/**
 * Update university_field_images table with newly generated CDN URLs,
 * then update professors table to use the new images.
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Load the CDN results from parallel generation
const cdnData = JSON.parse(readFileSync('/tmp/new_images_cdn.json', 'utf-8'));

// Add Princeton images manually (generated in main env)
const princetonImages = [
  {
    university_name: 'Princeton University',
    research_field: 'Medicine & Health',
    cdn_url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/princeton_university_medicine_health-mw6bDwMgMXu2HfAZTZyQJx.webp'
  },
  {
    university_name: 'Princeton University',
    research_field: 'Philosophy',
    cdn_url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/princeton_university_philosophy-ZxumVjXaBjEZ3Z2CsfXvYw.webp'
  }
];

const allImages = [...cdnData, ...princetonImages];

console.log(`Total images to update: ${allImages.length}`);

let upsertCount = 0;
let errorCount = 0;

for (const img of allImages) {
  if (!img.cdn_url || !img.university_name || !img.research_field) {
    console.log(`  ⚠️  Skipping incomplete entry: ${JSON.stringify(img)}`);
    continue;
  }

  try {
    // Upsert into university_field_images
    await connection.execute(
      `INSERT INTO university_field_images (university_name, research_field_name, image_url, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE image_url = VALUES(image_url)`,
      [img.university_name, img.research_field, img.cdn_url]
    );
    upsertCount++;
  } catch (err) {
    console.error(`  ❌ Error upserting ${img.university_name}/${img.research_field}: ${err.message}`);
    errorCount++;
  }
}

console.log(`\n✅ Upserted ${upsertCount} university_field_images entries`);
console.log(`❌ Errors: ${errorCount}`);

// Now update professors to use the new images
console.log('\n=== Updating professors with new images ===');

let profUpdateCount = 0;
for (const img of allImages) {
  if (!img.cdn_url || !img.university_name || !img.research_field) continue;

  try {
    const [result] = await connection.execute(
      `UPDATE professors 
       SET image_url = ?
       WHERE university_name = ? AND research_field = ?`,
      [img.cdn_url, img.university_name, img.research_field]
    );
    profUpdateCount += result.affectedRows;
  } catch (err) {
    console.error(`  ❌ Error updating professors for ${img.university_name}/${img.research_field}: ${err.message}`);
  }
}

console.log(`✅ Updated ${profUpdateCount} professor records with new images`);

// Final verification
const [stats] = await connection.execute(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END) as with_image,
    SUM(CASE WHEN image_url IS NULL THEN 1 ELSE 0 END) as without_image
  FROM professors
`);

const [imgCount] = await connection.execute(`SELECT COUNT(*) as total FROM university_field_images`);

console.log('\n=== FINAL DATABASE STATE ===');
console.log(`Total professors: ${stats[0].total}`);
console.log(`With image: ${stats[0].with_image} (${Math.round(stats[0].with_image/stats[0].total*100)}%)`);
console.log(`Without image: ${stats[0].without_image}`);
console.log(`university_field_images total: ${imgCount[0].total}`);

await connection.end();
console.log('\n✅ Done!');
