import { getDb } from '../server/db';
import { professors } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🔄 Reclassifying all 120 professors...\n');
  
  // Load the complete tag mapping
  const mappingData = JSON.parse(
    fs.readFileSync('/home/ubuntu/complete-tag-mapping.json', 'utf-8')
  );
  const mapping = mappingData.mapping;
  
  // Create reverse mapping: tag -> field
  const tagToField = new Map<string, string>();
  
  for (const [fieldName, tags] of Object.entries(mapping)) {
    for (const tag of tags as string[]) {
      tagToField.set(tag.toLowerCase().trim(), fieldName);
    }
  }
  
  console.log(`✅ Loaded mapping with ${tagToField.size} tags\n`);
  
  // Get all professors
  const allProfessors = await db.select().from(professors);
  console.log(`✅ Found ${allProfessors.length} professors\n`);
  
  let updatedCount = 0;
  let unchangedCount = 0;
  let unclassifiedCount = 0;
  const fieldChanges: Array<{name: string, old: string | null, new: string}> = [];
  
  for (const prof of allProfessors) {
    try {
      if (!prof.tags) {
        console.log(`⏭️  Skipped (no tags): ${prof.name}`);
        unclassifiedCount++;
        continue;
      }
      
      // Parse professor tags
      const profTags: string[] = JSON.parse(prof.tags as string);
      
      // Count matches for each field
      const fieldScores = new Map<string, number>();
      
      for (const tag of profTags) {
        const normalizedTag = tag.toLowerCase().trim();
        const fieldName = tagToField.get(normalizedTag);
        
        if (fieldName) {
          fieldScores.set(fieldName, (fieldScores.get(fieldName) || 0) + 1);
        }
      }
      
      if (fieldScores.size === 0) {
        console.log(`⚠️  No matching field found for: ${prof.name}`);
        console.log(`     Tags: ${profTags.slice(0, 3).join(', ')}${profTags.length > 3 ? '...' : ''}`);
        unclassifiedCount++;
        continue;
      }
      
      // Select the field with the most matching tags
      let bestField = '';
      let maxScore = 0;
      
      for (const [fieldName, score] of fieldScores.entries()) {
        if (score > maxScore) {
          maxScore = score;
          bestField = fieldName;
        }
      }
      
      // Check if field changed
      if (prof.researchField !== bestField) {
        fieldChanges.push({
          name: prof.name,
          old: prof.researchField,
          new: bestField
        });
        
        // Update professor
        await db
          .update(professors)
          .set({
            researchField: bestField
          })
          .where(eq(professors.id, prof.id));
        
        console.log(`✅ Updated: ${prof.name}`);
        console.log(`     ${prof.researchField || '(none)'} → ${bestField} (${maxScore} matching tags)`);
        updatedCount++;
      } else {
        unchangedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${prof.name}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Total professors: ${allProfessors.length}`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Unchanged: ${unchangedCount}`);
  console.log(`   Unclassified: ${unclassifiedCount}`);
  console.log('='.repeat(60));
  
  if (fieldChanges.length > 0) {
    console.log('\n📝 Field Changes:');
    for (const change of fieldChanges) {
      console.log(`   ${change.name}: ${change.old || '(none)'} → ${change.new}`);
    }
  }
  
  // Show final distribution
  const finalDistribution = await db.select().from(professors);
  const fieldCounts = new Map<string, number>();
  let professorsWithFields = 0;
  
  for (const prof of finalDistribution) {
    if (prof.researchField) {
      professorsWithFields++;
      fieldCounts.set(prof.researchField, (fieldCounts.get(prof.researchField) || 0) + 1);
    }
  }
  
  console.log('\n📊 Final Field Distribution:');
  const sortedFields = Array.from(fieldCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [fieldName, count] of sortedFields) {
    console.log(`   ${fieldName}: ${count} professors`);
  }
  
  console.log(`\n✅ Total professors with research field: ${professorsWithFields}/${finalDistribution.length}`);
}

main()
  .then(() => {
    console.log('\n✅ Reclassification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Reclassification failed:', error);
    process.exit(1);
  });
