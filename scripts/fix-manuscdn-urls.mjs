/**
 * Investigate professors with manuscdn.com URLs (from the uploaded JSON file).
 * These URLs come from another Manus account and may expire.
 * Replace them with our own CDN images from university_field_images table.
 */

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get all distinct (uni, field, url) for the manuscdn URLs
const [rows] = await connection.execute(`
  SELECT DISTINCT p.university_name, p.research_field, p.image_url,
    COUNT(*) as prof_count
  FROM professors p
  WHERE p.image_url LIKE '%manuscdn.com%'
  GROUP BY p.university_name, p.research_field, p.image_url
  ORDER BY p.university_name, p.research_field
`);

console.log(`Distinct (uni, field, url) combos with manuscdn URLs: ${rows.length}`);

// Group by university for display
const byUni = new Map();
for (const r of rows) {
  if (!byUni.has(r.university_name)) byUni.set(r.university_name, new Set());
  byUni.get(r.university_name).add(r.research_field);
}

console.log('\nUniversities with manuscdn URLs:');
for (const [uni, fields] of byUni) {
  console.log(`  ${uni} (${fields.size} fields): ${[...fields].join(', ')}`);
}

// Test a sample URL to see if it's accessible
const sampleUrl = rows[0]?.image_url;
if (sampleUrl) {
  console.log(`\nSample URL: ${sampleUrl}`);
  try {
    const resp = await fetch(sampleUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    console.log(`Sample URL status: ${resp.status}`);
  } catch (e) {
    console.log(`Sample URL error: ${e.message}`);
  }
}

// Load our own CDN images from university_field_images
const [imgRows] = await connection.execute(`
  SELECT university_name, research_field_name, image_url
  FROM university_field_images
  ORDER BY university_name, research_field_name
`);

const correctImageMap = new Map();
for (const img of imgRows) {
  correctImageMap.set(`${img.university_name}|${img.research_field_name}`, img.image_url);
}

console.log(`\nAvailable university_field_images entries: ${imgRows.length}`);

// Fix: replace manuscdn URLs with our own CDN images
let fixedCount = 0;
let notFoundCount = 0;
const notFoundCombos = [];

for (const r of rows) {
  const key = `${r.university_name}|${r.research_field}`;
  const correctUrl = correctImageMap.get(key);

  if (correctUrl && !correctUrl.includes('manuscdn.com')) {
    // We have a proper CDN URL for this uni+field - update all professors
    const [result] = await connection.execute(
      `UPDATE professors 
       SET image_url = ?
       WHERE university_name = ? AND research_field = ? AND image_url LIKE '%manuscdn.com%'`,
      [correctUrl, r.university_name, r.research_field]
    );
    fixedCount += result.affectedRows;
    if (result.affectedRows > 0) {
      console.log(`  ✅ Fixed ${result.affectedRows} professors: ${r.university_name} / ${r.research_field}`);
    }
  } else {
    notFoundCount++;
    notFoundCombos.push({ uni: r.university_name, field: r.research_field });
    console.log(`  ⚠️  No proper CDN image found for: ${r.university_name} / ${r.research_field}`);
  }
}

console.log(`\n✅ Fixed: ${fixedCount} professor records`);
console.log(`⚠️  Still need images: ${notFoundCombos.length} (uni, field) combos`);

if (notFoundCombos.length > 0) {
  console.log('\nCombos still needing images:');
  for (const c of notFoundCombos) {
    console.log(`  ${c.uni} / ${c.field}`);
  }
}

// Final check
const [remaining] = await connection.execute(`
  SELECT COUNT(*) as cnt FROM professors WHERE image_url LIKE '%manuscdn.com%'
`);
console.log(`\nRemaining manuscdn URLs in professors: ${remaining[0].cnt}`);

// Also check university_field_images for manuscdn URLs
const [imgRemaining] = await connection.execute(`
  SELECT COUNT(*) as cnt FROM university_field_images WHERE image_url LIKE '%manuscdn.com%'
`);
console.log(`Remaining manuscdn URLs in university_field_images: ${imgRemaining[0].cnt}`);

if (imgRemaining[0].cnt > 0) {
  const [imgRows2] = await connection.execute(`
    SELECT university_name, research_field_name, image_url
    FROM university_field_images 
    WHERE image_url LIKE '%manuscdn.com%'
    ORDER BY university_name
  `);
  console.log('\nuniversity_field_images with manuscdn URLs:');
  for (const r of imgRows2) {
    console.log(`  ${r.university_name} / ${r.research_field_name}`);
  }
}

await connection.end();
console.log('\n✅ Done!');
