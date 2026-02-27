/**
 * Focused audit: detect professors whose image_url belongs to a DIFFERENT university.
 * 
 * Logic:
 * - For each professor, look up their image_url in university_field_images
 * - If the image_url is found under a DIFFERENT university_name → cross-university contamination
 * - manuscdn.com URLs are treated as "original uploaded data" and excluded from this check
 *   (they are not our CDN images and can't be attributed to a specific university)
 * - Only our own CDN images (d2xsxph8kpxj0f.cloudfront.net) can be definitively attributed
 */

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Load all university_field_images - only our own CDN images
const [imgRows] = await connection.execute(`
  SELECT university_name, research_field_name, image_url
  FROM university_field_images
  WHERE image_url NOT LIKE '%manuscdn.com%'
  ORDER BY university_name, research_field_name
`);

console.log(`Our own CDN images in university_field_images: ${imgRows.length}`);

// Build reverse lookup: url -> list of {uni, field} owners
const urlToOwners = new Map();
for (const img of imgRows) {
  if (!urlToOwners.has(img.image_url)) {
    urlToOwners.set(img.image_url, []);
  }
  urlToOwners.get(img.image_url).push({ uni: img.university_name, field: img.research_field_name });
}

// Build forward lookup: "uni|field" -> correct url
const correctUrlMap = new Map();
for (const img of imgRows) {
  correctUrlMap.set(`${img.university_name}|${img.research_field_name}`, img.image_url);
}

// Load all professors with our own CDN images (exclude manuscdn.com)
const [profRows] = await connection.execute(`
  SELECT id, name, university_name, research_field, image_url
  FROM professors
  WHERE image_url IS NOT NULL
    AND image_url NOT LIKE '%manuscdn.com%'
  ORDER BY university_name, research_field
`);

console.log(`Professors with our own CDN images: ${profRows.length}`);

const crossUniProfs = [];
const correctCount = { exact: 0, sameUni: 0 };

for (const prof of profRows) {
  const owners = urlToOwners.get(prof.image_url);
  if (!owners) continue; // URL not in field_images (shouldn't happen for CDN URLs)

  const isOwnUni = owners.some(o => o.uni === prof.university_name);
  const otherUnis = owners.filter(o => o.uni !== prof.university_name);

  if (isOwnUni) {
    correctCount.exact++;
  } else if (otherUnis.length > 0) {
    // Image belongs ONLY to other universities - this is cross-university contamination
    crossUniProfs.push({
      prof_id: prof.id,
      prof_name: prof.name,
      prof_uni: prof.university_name,
      prof_field: prof.research_field,
      image_belongs_to: otherUnis.map(o => `${o.uni} / ${o.field}`).join('; '),
      correct_url: correctUrlMap.get(`${prof.university_name}|${prof.research_field}`) || 'N/A'
    });
  }
}

console.log('\n=== CROSS-UNIVERSITY IMAGE AUDIT RESULTS ===');
console.log(`✅ Professors with correct university-specific image: ${correctCount.exact}`);
console.log(`❌ Professors with ANOTHER university's image:       ${crossUniProfs.length}`);

if (crossUniProfs.length > 0) {
  console.log('\n=== CONTAMINATED PROFESSORS (sample) ===');
  
  // Group by professor's university
  const byUni = new Map();
  for (const p of crossUniProfs) {
    if (!byUni.has(p.prof_uni)) byUni.set(p.prof_uni, []);
    byUni.get(p.prof_uni).push(p);
  }
  
  for (const [uni, profs] of byUni) {
    const fields = [...new Set(profs.map(p => p.prof_field))];
    const borrowedFrom = [...new Set(profs.map(p => p.image_belongs_to.split(';')[0].split('/')[0].trim()))];
    console.log(`\n  ${uni} (${profs.length} professors affected):`);
    console.log(`    Fields: ${fields.join(', ')}`);
    console.log(`    Image borrowed from: ${borrowedFrom.join(', ')}`);
  }
} else {
  console.log('\n🎉 No cross-university image contamination found!');
  console.log('   Every professor with our CDN images is showing their own university\'s branded image.');
}

// Summary by university
console.log('\n=== SUMMARY BY UNIVERSITY ===');
const [uniStats] = await connection.execute(`
  SELECT 
    p.university_name,
    COUNT(*) as total,
    SUM(CASE WHEN p.image_url LIKE '%manuscdn.com%' THEN 1 ELSE 0 END) as manuscdn_count,
    SUM(CASE WHEN p.image_url NOT LIKE '%manuscdn.com%' AND p.image_url IS NOT NULL THEN 1 ELSE 0 END) as own_cdn_count,
    SUM(CASE WHEN p.image_url IS NULL THEN 1 ELSE 0 END) as no_image_count
  FROM professors p
  GROUP BY p.university_name
  ORDER BY p.university_name
`);

console.log('\nUniversity | Total | Own CDN | manuscdn | No Image');
console.log('-----------|-------|---------|----------|----------');
for (const s of uniStats) {
  const ownPct = Math.round(s.own_cdn_count / s.total * 100);
  const status = s.no_image_count > 0 ? '⚠️' : (s.manuscdn_count > 0 ? '📌' : '✅');
  console.log(`${status} ${s.university_name}: ${s.total} total | ${s.own_cdn_count} own CDN (${ownPct}%) | ${s.manuscdn_count} manuscdn | ${s.no_image_count} none`);
}

await connection.end();
console.log('\n✅ Audit complete.');
