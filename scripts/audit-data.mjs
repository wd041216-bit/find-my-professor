/**
 * Comprehensive data quality audit:
 * 1. Duplicate professors
 * 2. University field image coverage
 * 3. Professor image matching accuracy
 * 4. Research field normalization issues
 */

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// ─── 1. DUPLICATE ANALYSIS ─────────────────────────────────────────────────
console.log('='.repeat(70));
console.log('1. DUPLICATE PROFESSOR ANALYSIS');
console.log('='.repeat(70));

const [dupRows] = await connection.execute(`
  SELECT name, university_name, COUNT(*) as cnt, 
         GROUP_CONCAT(id ORDER BY id) as ids,
         GROUP_CONCAT(department ORDER BY id SEPARATOR ' | ') as depts
  FROM professors
  GROUP BY name, university_name
  HAVING cnt > 1
  ORDER BY cnt DESC, university_name
`);

console.log(`\nTotal duplicate groups (same name + university): ${dupRows.length}`);
let totalDupRecords = 0;
for (const row of dupRows) {
  totalDupRecords += row.cnt - 1;
}
console.log(`Total extra records to remove: ${totalDupRecords}`);

if (dupRows.length > 0) {
  console.log('\nSample duplicates (first 15):');
  for (const row of dupRows.slice(0, 15)) {
    console.log(`  [${row.cnt}x] ${row.name} @ ${row.university_name}`);
    console.log(`       IDs: ${row.ids}`);
  }
}

// ─── 2. UNIVERSITY FIELD IMAGE COVERAGE ────────────────────────────────────
console.log('\n' + '='.repeat(70));
console.log('2. UNIVERSITY FIELD IMAGE COVERAGE');
console.log('='.repeat(70));

const [uniRows] = await connection.execute(
  `SELECT DISTINCT university_name FROM professors ORDER BY university_name`
);

const [imgRows] = await connection.execute(
  `SELECT university_name, research_field_name, image_url FROM university_field_images`
);

// Build image lookup
const imgMap = new Map();
for (const img of imgRows) {
  imgMap.set(`${img.university_name}|${img.research_field_name}`, img.image_url);
}

// Get all distinct research fields per university in professors
const [profFieldRows] = await connection.execute(`
  SELECT university_name, research_field, COUNT(*) as cnt
  FROM professors
  WHERE research_field IS NOT NULL
  GROUP BY university_name, research_field
  ORDER BY university_name, research_field
`);

console.log(`\nUniversities in professors table: ${uniRows.length}`);

// Check which universities have NO field images at all
const imgsPerUni = new Map();
for (const img of imgRows) {
  imgsPerUni.set(img.university_name, (imgsPerUni.get(img.university_name) || 0) + 1);
}

const uniWithNoImages = uniRows.filter(r => !imgsPerUni.has(r.university_name));
console.log(`\nUniversities with NO field images at all: ${uniWithNoImages.length}`);
for (const r of uniWithNoImages) {
  console.log(`  ❌ ${r.university_name}`);
}

// Check field-level coverage
let missingCombos = 0;
const missingList = [];
for (const row of profFieldRows) {
  const key = `${row.university_name}|${row.research_field}`;
  if (!imgMap.has(key)) {
    missingCombos++;
    missingList.push({ uni: row.university_name, field: row.research_field, cnt: row.cnt });
  }
}

console.log(`\nMissing (university, field) image combos: ${missingCombos}`);
if (missingList.length > 0) {
  // Group by university
  const byUni = new Map();
  for (const item of missingList) {
    if (!byUni.has(item.uni)) byUni.set(item.uni, []);
    byUni.get(item.uni).push(`${item.field}(${item.cnt})`);
  }
  console.log('\nMissing by university:');
  for (const [uni, fields] of byUni) {
    console.log(`  ❌ ${uni}: missing [${fields.join(', ')}]`);
  }
}

// ─── 3. PROFESSOR IMAGE MATCHING ACCURACY ──────────────────────────────────
console.log('\n' + '='.repeat(70));
console.log('3. PROFESSOR IMAGE MATCHING ACCURACY');
console.log('='.repeat(70));

const [profImgStats] = await connection.execute(`
  SELECT 
    university_name,
    COUNT(*) as total,
    SUM(CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END) as has_image,
    SUM(CASE WHEN image_url IS NULL THEN 1 ELSE 0 END) as no_image
  FROM professors
  GROUP BY university_name
  ORDER BY no_image DESC, university_name
`);

let totalNoImage = 0;
let totalWithImage = 0;
const unisMissingImages = [];

for (const row of profImgStats) {
  totalNoImage += Number(row.no_image);
  totalWithImage += Number(row.has_image);
  if (row.no_image > 0) {
    const pct = Math.round(row.has_image / row.total * 100);
    unisMissingImages.push(`  ${pct < 50 ? '❌' : '⚠️ '} ${row.university_name}: ${row.has_image}/${row.total} have images (${pct}%)`);
  }
}

const grandTotal = totalNoImage + totalWithImage;
console.log(`\nTotal professors: ${grandTotal}`);
console.log(`With image_url: ${totalWithImage} (${Math.round(totalWithImage/grandTotal*100)}%)`);
console.log(`Without image_url: ${totalNoImage} (${Math.round(totalNoImage/grandTotal*100)}%)`);

if (unisMissingImages.length > 0) {
  console.log('\nUniversities with professors missing images:');
  unisMissingImages.forEach(l => console.log(l));
}

// ─── 4. RESEARCH FIELD NORMALIZATION ISSUES ────────────────────────────────
console.log('\n' + '='.repeat(70));
console.log('4. RESEARCH FIELD VALUES IN PROFESSORS TABLE');
console.log('='.repeat(70));

const [fieldVariants] = await connection.execute(`
  SELECT research_field, COUNT(*) as cnt
  FROM professors
  GROUP BY research_field
  ORDER BY cnt DESC
`);

// Get all unique research_field_name values in images table
const [imgFieldRows] = await connection.execute(
  `SELECT DISTINCT research_field_name FROM university_field_images`
);
const imgFields = new Set(imgFieldRows.map(r => r.research_field_name));

console.log(`\nAll research_field values in professors table (${fieldVariants.length} unique):`);
for (const row of fieldVariants) {
  const inImgTable = imgFields.has(row.research_field);
  console.log(`  ${inImgTable ? '✅' : '⚠️ '} "${row.research_field}": ${row.cnt} profs`);
}

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log(`  Duplicate groups to fix: ${dupRows.length} (${totalDupRecords} extra records)`);
console.log(`  Universities missing all images: ${uniWithNoImages.length}`);
console.log(`  Missing (uni, field) image combos: ${missingCombos}`);
console.log(`  Professors without image_url: ${totalNoImage}`);

await connection.end();
