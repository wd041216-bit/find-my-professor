import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./drizzle/db.sqlite');

// Load existing mappings
const mappingsContent = fs.readFileSync('./shared/universityFieldImages.ts', 'utf8');

// Get all unique university + research_field combinations
const allCombinations = db.prepare(`
  SELECT DISTINCT university_name, research_field, COUNT(*) as count
  FROM professors
  GROUP BY university_name, research_field
  ORDER BY university_name, count DESC
`).all();

console.log('Analyzing image mappings...\n');

const missing = [];
const covered = [];

allCombinations.forEach(combo => {
  const { university_name, research_field, count } = combo;
  
  // Check if mapping exists in the file
  const universitySection = `"${university_name}": {`;
  const fieldMapping = `"${research_field}":`;
  
  const hasUniversitySection = mappingsContent.includes(universitySection);
  const hasFieldMapping = mappingsContent.includes(fieldMapping) && 
                          mappingsContent.indexOf(fieldMapping) > mappingsContent.indexOf(universitySection) &&
                          (mappingsContent.indexOf(fieldMapping) < mappingsContent.indexOf('},', mappingsContent.indexOf(universitySection)) || 
                           mappingsContent.lastIndexOf(fieldMapping) > mappingsContent.lastIndexOf(universitySection));
  
  // Simplified check: just see if both university and field appear in the file
  const roughCheck = mappingsContent.includes(`"${university_name}"`) && 
                     mappingsContent.includes(`"${research_field}"`);
  
  if (roughCheck) {
    covered.push({ university: university_name, field: research_field, count });
  } else {
    missing.push({ university: university_name, field: research_field, count });
  }
});

console.log(`✅ COVERED (${covered.length} combinations):`);
covered.forEach(c => {
  console.log(`  - ${c.university} / ${c.field} (${c.count} professors)`);
});

console.log(`\n❌ MISSING (${missing.length} combinations):`);
missing.forEach(m => {
  console.log(`  - ${m.university} / ${m.field} (${m.count} professors)`);
});

console.log(`\n📊 Summary:`);
console.log(`  Total combinations: ${allCombinations.length}`);
console.log(`  Covered: ${covered.length} (${(covered.length / allCombinations.length * 100).toFixed(1)}%)`);
console.log(`  Missing: ${missing.length} (${(missing.length / allCombinations.length * 100).toFixed(1)}%)`);

// Save missing combinations to file for image generation
fs.writeFileSync('/tmp/missing-images.json', JSON.stringify(missing, null, 2));
console.log(`\n💾 Missing combinations saved to /tmp/missing-images.json`);

db.close();
