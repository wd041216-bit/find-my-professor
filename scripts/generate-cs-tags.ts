import { getDb } from '../server/db';
import { professors } from '../drizzle/schema';
import { sql, eq } from 'drizzle-orm';

/**
 * Convert research interests to tags
 * Example: "Machine Learning" -> "machine-learning"
 */
function convertInterestsToTags(interests: string[]): string[] {
  return interests.map(interest => 
    interest
      .toLowerCase()
      .replace(/[&]/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  ).filter(tag => tag.length > 0);
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🏷️  Generating tags for CS professors...\n');
  
  // Get all CS professors
  const csProfessors = await db
    .select()
    .from(professors)
    .where(sql`major_name LIKE '%Computer Science%'`);
  
  console.log(`✅ Found ${csProfessors.length} CS professors`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const prof of csProfessors) {
    try {
      // Parse research interests
      let researchInterests: string[] = [];
      if (prof.researchInterests) {
        try {
          researchInterests = JSON.parse(prof.researchInterests as string);
        } catch (e) {
          console.warn(`Warning: Cannot parse research interests for ${prof.name}`);
          continue;
        }
      }
      
      if (researchInterests.length === 0) {
        console.log(`⏭️  Skipped (no research interests): ${prof.name}`);
        skippedCount++;
        continue;
      }
      
      // Convert to tags
      const tags = convertInterestsToTags(researchInterests);
      
      // Update professor
      await db
        .update(professors)
        .set({
          tags: JSON.stringify(tags)
        })
        .where(eq(professors.id, prof.id));
      
      console.log(`✅ Updated: ${prof.name} (${tags.length} tags: ${tags.slice(0, 3).join(', ')}...)`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error updating ${prof.name}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Total CS professors: ${csProfessors.length}`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log('='.repeat(60));
}

main()
  .then(() => {
    console.log('\n✅ Tag generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Tag generation failed:', error);
    process.exit(1);
  });
