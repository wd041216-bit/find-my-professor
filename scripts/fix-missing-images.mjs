/**
 * Fix professors still missing image_url by:
 * 1. Building a "best available image" lookup per research_field (from any university)
 * 2. Updating professors that still have NULL image_url
 * 3. Also insert missing university_field_images entries for affected universities
 */

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Load all field images
const [imgRows] = await connection.execute(
  `SELECT university_name, research_field_name, image_url FROM university_field_images`
);

// Build two lookups:
// 1. Exact: "university|field" → url
// 2. Fallback: "field" → best url (prefer well-known universities)
const exactMap = new Map();
const fieldFallbackMap = new Map();

// Priority order for fallback (prefer these universities' images)
const preferredUnis = [
  'Harvard University', 'MIT', 'Stanford University', 'Yale University',
  'Princeton University', 'Columbia University', 'Carnegie Mellon University',
  'Duke University', 'Northwestern University', 'Brown University'
];

for (const img of imgRows) {
  exactMap.set(`${img.university_name}|${img.research_field_name}`, img.image_url);
}

// Build fallback by field (use preferred university images when available)
for (const preferredUni of preferredUnis) {
  for (const img of imgRows) {
    if (img.university_name === preferredUni && !fieldFallbackMap.has(img.research_field_name)) {
      fieldFallbackMap.set(img.research_field_name, img.image_url);
    }
  }
}
// Fill in any remaining fields from any university
for (const img of imgRows) {
  if (!fieldFallbackMap.has(img.research_field_name)) {
    fieldFallbackMap.set(img.research_field_name, img.image_url);
  }
}

console.log(`Exact image map: ${exactMap.size} entries`);
console.log(`Field fallback map: ${fieldFallbackMap.size} unique fields`);
console.log(`Available fallback fields: ${[...fieldFallbackMap.keys()].join(', ')}`);

// Get professors still missing image_url
const [missingProfs] = await connection.execute(`
  SELECT id, university_name, research_field
  FROM professors
  WHERE image_url IS NULL
  ORDER BY university_name, research_field
`);

console.log(`\nProfessors still missing image_url: ${missingProfs.length}`);

let fixedCount = 0;
let stillMissingCount = 0;

for (const prof of missingProfs) {
  // Try exact match first
  let imageUrl = exactMap.get(`${prof.university_name}|${prof.research_field}`);
  
  // Fall back to any university's image for this field
  if (!imageUrl) {
    imageUrl = fieldFallbackMap.get(prof.research_field);
  }
  
  if (imageUrl) {
    await connection.execute(
      `UPDATE professors SET image_url = ? WHERE id = ?`,
      [imageUrl, prof.id]
    );
    fixedCount++;
  } else {
    stillMissingCount++;
    console.log(`  ⚠️  No image found for field: "${prof.research_field}" (${prof.university_name})`);
  }
}

console.log(`\n✅ Fixed: ${fixedCount} professors`);
console.log(`⚠️  Still missing: ${stillMissingCount} professors`);

// Also insert university_field_images entries for universities that are missing them
// so future professors from those universities get matched correctly
console.log('\n=== Inserting missing university_field_images entries ===');

const [uniRows] = await connection.execute(
  `SELECT DISTINCT university_name FROM professors ORDER BY university_name`
);

let insertedImgCount = 0;
for (const { university_name } of uniRows) {
  // Get all fields used by this university
  const [fields] = await connection.execute(
    `SELECT DISTINCT research_field FROM professors WHERE university_name = ? AND research_field IS NOT NULL`,
    [university_name]
  );
  
  for (const { research_field } of fields) {
    const key = `${university_name}|${research_field}`;
    if (!exactMap.has(key)) {
      // Insert using fallback image
      const fallbackUrl = fieldFallbackMap.get(research_field);
      if (fallbackUrl) {
        try {
          await connection.execute(
            `INSERT INTO university_field_images (university_name, research_field_name, image_url, created_at)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE image_url = VALUES(image_url)`,
            [university_name, research_field, fallbackUrl]
          );
          exactMap.set(key, fallbackUrl); // update local cache
          insertedImgCount++;
        } catch (err) {
          console.error(`  Error inserting image for ${university_name}/${research_field}: ${err.message}`);
        }
      }
    }
  }
}

console.log(`✅ Inserted/updated ${insertedImgCount} university_field_images entries`);

// Final verification
const [totalCount] = await connection.execute(`SELECT COUNT(*) as total FROM professors`);
const [withImgCount] = await connection.execute(`SELECT COUNT(*) as total FROM professors WHERE image_url IS NOT NULL`);
const [imgTableCount] = await connection.execute(`SELECT COUNT(*) as total FROM university_field_images`);

const total = totalCount[0].total;
const withImg = withImgCount[0].total;

console.log('\n=== FINAL STATS ===');
console.log(`Total professors: ${total}`);
console.log(`With image_url: ${withImg} (${Math.round(withImg/total*100)}%)`);
console.log(`Without image_url: ${total - withImg} (${Math.round((total-withImg)/total*100)}%)`);
console.log(`university_field_images entries: ${imgTableCount[0].total}`);

await connection.end();
console.log('\n✅ Done!');
