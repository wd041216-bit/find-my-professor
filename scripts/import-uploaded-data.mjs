/**
 * Import professors_data.json and university_field_images_data.json
 * into the current database.
 *
 * Transformations applied:
 * 1. Fix corrupt image_url fields (extract CDN URL from log text)
 * 2. Convert tags from comma-separated string to JSON array
 * 3. Map field names: university → university_name, research_field → research_field
 * 4. Match professor images from university_field_images table
 * 5. Skip duplicates (same name + university_name)
 */

import fs from 'fs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

// Load data files
const professors = JSON.parse(fs.readFileSync('/home/ubuntu/upload/professors_data.json', 'utf-8'));
const fieldImages = JSON.parse(fs.readFileSync('/home/ubuntu/upload/university_field_images_data.json', 'utf-8'));

console.log(`Loaded ${professors.length} professors`);
console.log(`Loaded ${fieldImages.length} field images`);

// Helper: extract clean CDN URL from potentially corrupt field
function extractCdnUrl(urlField) {
  if (!urlField) return null;
  if (urlField.startsWith('http')) return urlField;
  const match = urlField.match(/CDN URL: (https:\/\/\S+)/);
  return match ? match[1] : null;
}

// Helper: convert comma-separated tags string to JSON array string
function tagsToJson(tagsStr) {
  if (!tagsStr) return JSON.stringify([]);
  if (Array.isArray(tagsStr)) return JSON.stringify(tagsStr);
  // Split by comma, trim whitespace, filter empty
  const arr = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
  return JSON.stringify(arr);
}

// Build image lookup map: "university|research_field" → imageUrl
const imageMap = new Map();
for (const img of fieldImages) {
  const url = extractCdnUrl(img.image_url);
  if (url) {
    const key = `${img.university}|${img.research_field}`;
    imageMap.set(key, url);
  }
}
console.log(`Built image map with ${imageMap.size} entries`);

// Connect to database
const connection = await mysql.createConnection(DATABASE_URL);
console.log('Connected to database');

// ─── Phase 1: Insert university_field_images ───────────────────────────────
console.log('\n=== Phase 1: Inserting university field images ===');

let imgInserted = 0;
let imgSkipped = 0;
let imgErrors = 0;

for (const img of fieldImages) {
  const url = extractCdnUrl(img.image_url);
  if (!url) {
    imgErrors++;
    continue;
  }

  try {
    await connection.execute(
      `INSERT INTO university_field_images (university_name, research_field_name, image_url, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE image_url = VALUES(image_url)`,
      [img.university, img.research_field, url]
    );
    imgInserted++;
  } catch (err) {
    imgErrors++;
    console.error(`  ❌ Image insert error [${img.university} / ${img.research_field}]: ${err.message}`);
  }
}

console.log(`  ✅ Images inserted/updated: ${imgInserted}`);
console.log(`  ⚠️  Images with errors: ${imgErrors}`);

// ─── Phase 2: Check existing professors to avoid duplicates ───────────────
console.log('\n=== Phase 2: Checking existing professors ===');

const [existingRows] = await connection.execute(
  `SELECT name, university_name FROM professors`
);
const existingSet = new Set(existingRows.map(r => `${r.name}|${r.university_name}`));
console.log(`  Existing professors in DB: ${existingSet.size}`);

// ─── Phase 3: Insert professors ───────────────────────────────────────────
console.log('\n=== Phase 3: Inserting professors ===');

let profInserted = 0;
let profSkipped = 0;
let profErrors = 0;
const BATCH_SIZE = 1;

for (let i = 0; i < professors.length; i++) {
  const prof = professors[i];

  // Skip duplicates
  const dedupKey = `${prof.name}|${prof.university}`;
  if (existingSet.has(dedupKey)) {
    profSkipped++;
    continue;
  }

  // Determine image URL: use existing prof image if available, else look up field image
  let imageUrl = null;
  if (prof.image_url && prof.image_url.startsWith('http')) {
    imageUrl = prof.image_url;
  } else {
    // Look up from field images map
    const imgKey = `${prof.university}|${prof.research_field}`;
    imageUrl = imageMap.get(imgKey) || null;
  }

  // Convert tags to JSON array
  const tagsJson = tagsToJson(prof.tags);

  try {
    await connection.execute(
      `INSERT INTO professors (university_name, name, title, department, research_field, tags, image_url, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        prof.university,           // university_name
        prof.name,                 // name
        prof.title || null,        // title
        prof.department || '',     // department
        prof.research_field || null, // research_field
        tagsJson,                  // tags (JSON array string)
        imageUrl,                  // image_url
      ]
    );
    profInserted++;
    existingSet.add(dedupKey);

    if (profInserted % 100 === 0) {
      console.log(`  Progress: ${profInserted} inserted, ${profSkipped} skipped, ${i + 1}/${professors.length} processed`);
    }
  } catch (err) {
    profErrors++;
    if (profErrors <= 5) {
      console.error(`  ❌ Prof insert error [${prof.name} @ ${prof.university}]: ${err.message}`);
    }
  }
}

console.log(`\n=== FINAL RESULTS ===`);
console.log(`  Images: ${imgInserted} inserted/updated, ${imgErrors} errors`);
console.log(`  Professors: ${profInserted} inserted, ${profSkipped} skipped (duplicates), ${profErrors} errors`);

// Verify
const [countResult] = await connection.execute(`SELECT COUNT(*) as total FROM professors`);
const [uniResult] = await connection.execute(`SELECT COUNT(DISTINCT university_name) as unis FROM professors`);
console.log(`\n  Total professors in DB: ${countResult[0].total}`);
console.log(`  Total universities in DB: ${uniResult[0].unis}`);

await connection.end();
console.log('\n✅ Import complete!');
