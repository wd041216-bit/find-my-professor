/**
 * Data Quality Fix Script
 * 
 * Fixes:
 * 1. Remove duplicate professors (keep lowest ID)
 * 2. Normalize non-standard research_field values to standard ones
 * 3. Fix image_url for professors missing images (match from university_field_images)
 */

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// ─── STEP 1: Remove duplicate professors ───────────────────────────────────
console.log('='.repeat(60));
console.log('STEP 1: Removing duplicate professors');
console.log('='.repeat(60));

// Find all duplicate groups and keep only the lowest ID
const [dupRows] = await connection.execute(`
  SELECT name, university_name, MIN(id) as keep_id, GROUP_CONCAT(id ORDER BY id) as all_ids
  FROM professors
  GROUP BY name, university_name
  HAVING COUNT(*) > 1
`);

console.log(`Found ${dupRows.length} duplicate groups`);

let deletedCount = 0;
for (const row of dupRows) {
  const allIds = row.all_ids.split(',').map(Number);
  const idsToDelete = allIds.filter(id => id !== row.keep_id);
  
  for (const id of idsToDelete) {
    await connection.execute(`DELETE FROM professors WHERE id = ?`, [id]);
    deletedCount++;
  }
}

console.log(`✅ Deleted ${deletedCount} duplicate records`);

// ─── STEP 2: Normalize research_field values ───────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('STEP 2: Normalizing research_field values');
console.log('='.repeat(60));

// Mapping of non-standard → standard field names
// Standard fields are those that exist in university_field_images table
const fieldNormalization = {
  // Princeton-specific fields → standard
  'History': 'Arts & Humanities',
  'Literature & Languages': 'Arts & Humanities',
  'Arts & Design': 'Arts & Humanities',
  'Music & Theater': 'Arts & Humanities',
  'Political Science': 'Social Sciences',
  'Sociology & Anthropology': 'Social Sciences',
  'Sociology': 'Social Sciences',
  'Business & Management': 'Business',
  'Architecture & Planning': 'Engineering',
  // Misc
  'Other': 'Social Sciences',
  'N/A': 'Social Sciences',
  'Finance': 'Economics',
};

let normalizedCount = 0;
for (const [oldField, newField] of Object.entries(fieldNormalization)) {
  const [result] = await connection.execute(
    `UPDATE professors SET research_field = ? WHERE research_field = ?`,
    [newField, oldField]
  );
  if (result.affectedRows > 0) {
    console.log(`  "${oldField}" → "${newField}": ${result.affectedRows} professors updated`);
    normalizedCount += result.affectedRows;
  }
}

console.log(`✅ Normalized ${normalizedCount} research_field values`);

// ─── STEP 3: Fix image_url for professors missing images ───────────────────
console.log('\n' + '='.repeat(60));
console.log('STEP 3: Fixing missing image_url');
console.log('='.repeat(60));

// Load all university field images into memory
const [imgRows] = await connection.execute(
  `SELECT university_name, research_field_name, image_url FROM university_field_images`
);

const imgMap = new Map();
for (const img of imgRows) {
  imgMap.set(`${img.university_name}|${img.research_field_name}`, img.image_url);
}

console.log(`Loaded ${imgMap.size} university field images`);

// Get all professors missing image_url
const [missingImgProfs] = await connection.execute(`
  SELECT id, university_name, research_field
  FROM professors
  WHERE image_url IS NULL
`);

console.log(`Professors missing image_url: ${missingImgProfs.length}`);

let fixedCount = 0;
let stillMissingCount = 0;
const stillMissingByUni = new Map();

for (const prof of missingImgProfs) {
  const key = `${prof.university_name}|${prof.research_field}`;
  const imageUrl = imgMap.get(key);
  
  if (imageUrl) {
    await connection.execute(
      `UPDATE professors SET image_url = ? WHERE id = ?`,
      [imageUrl, prof.id]
    );
    fixedCount++;
  } else {
    stillMissingCount++;
    const uni = prof.university_name;
    if (!stillMissingByUni.has(uni)) stillMissingByUni.set(uni, new Set());
    stillMissingByUni.get(uni).add(prof.research_field);
  }
}

console.log(`✅ Fixed image_url for ${fixedCount} professors`);
console.log(`⚠️  Still missing image_url: ${stillMissingCount} professors`);

if (stillMissingByUni.size > 0) {
  console.log('\nUniversities still missing images (no field image available):');
  for (const [uni, fields] of stillMissingByUni) {
    console.log(`  ${uni}: fields [${[...fields].join(', ')}]`);
  }
}

// ─── FINAL VERIFICATION ────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('FINAL VERIFICATION');
console.log('='.repeat(60));

const [totalCount] = await connection.execute(`SELECT COUNT(*) as total FROM professors`);
const [withImgCount] = await connection.execute(`SELECT COUNT(*) as total FROM professors WHERE image_url IS NOT NULL`);
const [dupCheck] = await connection.execute(`
  SELECT COUNT(*) as dup_groups FROM (
    SELECT name, university_name FROM professors GROUP BY name, university_name HAVING COUNT(*) > 1
  ) t
`);
const [uniCount] = await connection.execute(`SELECT COUNT(DISTINCT university_name) as total FROM professors`);

const total = totalCount[0].total;
const withImg = withImgCount[0].total;
const dupGroups = dupCheck[0].dup_groups;

console.log(`\nTotal professors: ${total}`);
console.log(`Universities: ${uniCount[0].total}`);
console.log(`With image_url: ${withImg} (${Math.round(withImg/total*100)}%)`);
console.log(`Without image_url: ${total - withImg} (${Math.round((total-withImg)/total*100)}%)`);
console.log(`Remaining duplicate groups: ${dupGroups}`);

await connection.end();
console.log('\n✅ Data quality fix complete!');
