/**
 * Comprehensive audit: verify every professor has a university-specific image.
 * 
 * Strategy:
 * 1. Load all university_field_images entries (these are the "authoritative" images per uni+field)
 * 2. For each professor, check if their image_url matches the university_field_images entry
 *    for their (university_name, research_field) combination
 * 3. Flag professors whose image_url does NOT match their university's image
 *    (meaning they have a borrowed image from another university)
 * 4. Also detect professors whose image_url matches a DIFFERENT university's image
 */

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Step 1: Load all university_field_images
const [imgRows] = await connection.execute(`
  SELECT university_name, research_field_name, image_url
  FROM university_field_images
  ORDER BY university_name, research_field_name
`);

// Build lookup: "uni|field" -> url
const correctImageMap = new Map();
for (const img of imgRows) {
  correctImageMap.set(`${img.university_name}|${img.research_field_name}`, img.image_url);
}

// Build reverse lookup: url -> [uni, field] (to detect which uni an image belongs to)
const urlToUniField = new Map();
for (const img of imgRows) {
  if (!urlToUniField.has(img.image_url)) {
    urlToUniField.set(img.image_url, []);
  }
  urlToUniField.get(img.image_url).push({ uni: img.university_name, field: img.research_field_name });
}

console.log(`university_field_images entries: ${imgRows.length}`);
console.log(`Unique image URLs in field images: ${urlToUniField.size}`);

// Step 2: Load all professors
const [profRows] = await connection.execute(`
  SELECT id, name, university_name, research_field, image_url
  FROM professors
  ORDER BY university_name, research_field
`);

console.log(`Total professors: ${profRows.length}`);

// Step 3: Categorize each professor's image
const stats = {
  correct: 0,          // image matches their university's image
  wrong_uni: 0,        // image belongs to a different university
  no_image: 0,         // null image_url
  no_field_image: 0,   // no entry in university_field_images for this uni+field
  unknown_url: 0,      // image URL not found in university_field_images at all
};

const wrongUniProfs = [];    // professors with another university's image
const noFieldImageProfs = []; // professors whose uni+field has no entry in field_images
const unknownUrlProfs = [];  // professors with an image URL not in field_images

for (const prof of profRows) {
  if (!prof.image_url) {
    stats.no_image++;
    continue;
  }

  const key = `${prof.university_name}|${prof.research_field}`;
  const correctUrl = correctImageMap.get(key);

  if (!correctUrl) {
    // No entry in university_field_images for this uni+field
    stats.no_field_image++;
    noFieldImageProfs.push({
      id: prof.id,
      name: prof.name,
      university: prof.university_name,
      field: prof.research_field,
      current_url: prof.image_url?.substring(0, 80)
    });
    continue;
  }

  if (prof.image_url === correctUrl) {
    // Perfect match
    stats.correct++;
  } else {
    // Image URL doesn't match the correct one for this uni+field
    // Check if it belongs to another university
    const owners = urlToUniField.get(prof.image_url);
    if (owners) {
      const otherOwners = owners.filter(o => o.uni !== prof.university_name);
      if (otherOwners.length > 0) {
        stats.wrong_uni++;
        wrongUniProfs.push({
          id: prof.id,
          name: prof.name,
          university: prof.university_name,
          field: prof.research_field,
          current_image_owner: otherOwners.map(o => `${o.uni}/${o.field}`).join(', '),
          correct_url: correctUrl?.substring(0, 80),
          current_url: prof.image_url?.substring(0, 80)
        });
      } else {
        // URL belongs to this university but different field - still technically correct branding
        stats.correct++;
      }
    } else {
      // URL not found in field_images at all (could be a personal professor photo or old URL)
      stats.unknown_url++;
      unknownUrlProfs.push({
        id: prof.id,
        name: prof.name,
        university: prof.university_name,
        field: prof.research_field,
        current_url: prof.image_url?.substring(0, 80)
      });
    }
  }
}

console.log('\n=== AUDIT RESULTS ===');
console.log(`✅ Correct (university-specific image): ${stats.correct} professors`);
console.log(`❌ Wrong university image (borrowed):   ${stats.wrong_uni} professors`);
console.log(`⚠️  No field image entry for uni+field: ${stats.no_field_image} professors`);
console.log(`❓ Unknown URL (not in field_images):   ${stats.unknown_url} professors`);
console.log(`🚫 No image at all:                     ${stats.no_image} professors`);
console.log(`Total: ${profRows.length}`);

if (wrongUniProfs.length > 0) {
  console.log('\n=== BORROWED IMAGES (Wrong University) ===');
  // Group by university
  const byUni = new Map();
  for (const p of wrongUniProfs) {
    if (!byUni.has(p.university)) byUni.set(p.university, []);
    byUni.get(p.university).push(p);
  }
  for (const [uni, profs] of byUni) {
    console.log(`\n${uni} (${profs.length} professors with borrowed images):`);
    // Show unique field combos
    const fields = [...new Set(profs.map(p => p.field))];
    console.log(`  Fields affected: ${fields.join(', ')}`);
    console.log(`  Image borrowed from: ${[...new Set(profs.map(p => p.current_image_owner))].slice(0,3).join('; ')}`);
  }
}

if (noFieldImageProfs.length > 0) {
  console.log('\n=== NO FIELD IMAGE ENTRY ===');
  const byUni = new Map();
  for (const p of noFieldImageProfs) {
    if (!byUni.has(p.university)) byUni.set(p.university, []);
    byUni.get(p.university).push(p.field);
  }
  for (const [uni, fields] of byUni) {
    const uniqueFields = [...new Set(fields)];
    console.log(`  ${uni}: ${uniqueFields.join(', ')}`);
  }
}

if (unknownUrlProfs.length > 0) {
  console.log('\n=== UNKNOWN URL SAMPLE (first 10) ===');
  for (const p of unknownUrlProfs.slice(0, 10)) {
    console.log(`  ${p.university} / ${p.field}: ${p.current_url}`);
  }
  
  // Group by university
  const byUni = new Map();
  for (const p of unknownUrlProfs) {
    if (!byUni.has(p.university)) byUni.set(p.university, 0);
    byUni.set(p.university, byUni.get(p.university) + 1);
  }
  console.log('\nUnknown URL count by university:');
  for (const [uni, count] of [...byUni.entries()].sort((a,b) => b[1]-a[1])) {
    console.log(`  ${uni}: ${count}`);
  }
}

await connection.end();
console.log('\n✅ Audit complete.');
