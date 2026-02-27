/**
 * Find all (university, research_field) combos that need newly generated images.
 * These are universities that previously had no images and got "borrowed" images
 * from other universities in the fix-missing-images step.
 * 
 * We identify them by checking which universities' field images have URLs
 * that don't match the university name in the URL path (i.e., borrowed from another uni).
 * 
 * Actually, the simpler approach: find all universities that were listed as
 * "missing all images" in the audit, plus any that had partial coverage gaps.
 */

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Universities that originally had NO images (from the audit report):
// Ohio State University, Northeastern University, University of Texas at Dallas,
// Pepperdine University, University of Michigan
// Plus universities with partial gaps that got borrowed images.

// Get all distinct (university, research_field) combos from professors
const [profFields] = await connection.execute(`
  SELECT DISTINCT university_name, research_field
  FROM professors
  WHERE research_field IS NOT NULL
  ORDER BY university_name, research_field
`);

// Get all entries in university_field_images
const [imgEntries] = await connection.execute(`
  SELECT university_name, research_field_name, image_url
  FROM university_field_images
  ORDER BY university_name, research_field_name
`);

// Build a map of what images exist per university
const imgMap = new Map();
for (const img of imgEntries) {
  imgMap.set(`${img.university_name}|${img.research_field_name}`, img.image_url);
}

// The universities that originally had NO images at all (need all fields generated)
const uniWithNoOriginalImages = [
  'Ohio State University',
  'Northeastern University', 
  'University of Texas at Dallas',
  'Pepperdine University',
  'University of Michigan',
];

// Also find universities with partial gaps (had some images but not all fields)
// These are universities where some (uni, field) combos were missing
// We can detect this by checking which universities have entries that were
// inserted by the fix script (all entries for these unis were inserted as borrowed)

// For now, let's get the complete list of (university, field) combos that need images
// for the 5 universities with NO original images
const needsImages = [];

for (const { university_name, research_field } of profFields) {
  if (uniWithNoOriginalImages.includes(university_name)) {
    needsImages.push({ university_name, research_field });
  }
}

// Also check partial-gap universities from the audit:
// Princeton, MIT, Harvard, Columbia, Johns Hopkins, Rice, UVA, UWashington, Stanford
// These had some fields missing. Let's find which specific combos were gaps
// by checking if the image URL in university_field_images matches a "borrowed" pattern.
// Since we can't easily detect borrowed vs original, let's just list the specific
// fields that were missing per the audit output.

const partialGapUniversities = {
  'Princeton University': ['Medicine & Health', 'Philosophy'],
  'MIT': ['Social Sciences', 'Medicine & Health', 'Education', 'Philosophy'],
  'Harvard University': ['Medicine & Health', 'Biomedical Engineering'],
  'Columbia University': ['Physics', 'Psychology', 'Social Sciences'],
  'Johns Hopkins University': ['Arts & Humanities', 'Medicine & Health'],
  'Lehigh University': ['Law'],
  'Rice University': ['Arts & Humanities', 'Medicine & Health'],
  'Stanford University': ['Arts & Humanities', 'Biology', 'Biomedical Engineering', 'Business', 'Chemistry', 'Computer Science', 'Data Science', 'Economics', 'Engineering', 'Environmental Science', 'Law', 'Materials Science', 'Mathematics', 'Medicine & Health', 'Physics', 'Psychology', 'Social Sciences'],
  'University of Virginia': ['Data Science', 'Economics', 'Law', 'Materials Science', 'Mathematics', 'Medicine & Health'],
  'University of Washington': ['Arts & Humanities', 'Business', 'Social Sciences'],
};

for (const [uni, fields] of Object.entries(partialGapUniversities)) {
  for (const field of fields) {
    needsImages.push({ university_name: uni, research_field: field });
  }
}

// Group by university for display
const byUni = new Map();
for (const item of needsImages) {
  if (!byUni.has(item.university_name)) byUni.set(item.university_name, []);
  byUni.get(item.university_name).push(item.research_field);
}

console.log(`Total (university, field) combos needing new images: ${needsImages.length}`);
console.log(`Universities affected: ${byUni.size}`);
console.log('');

for (const [uni, fields] of byUni) {
  console.log(`${uni} (${fields.length} fields):`);
  console.log(`  ${fields.join(', ')}`);
}

// Output as JSON for use in parallel processing
const outputPath = '/tmp/unis_needing_images.json';
import { writeFileSync } from 'fs';
writeFileSync(outputPath, JSON.stringify(needsImages, null, 2));
console.log(`\nSaved to ${outputPath}`);

await connection.end();
