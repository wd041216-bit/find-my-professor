import { getDb } from '../server/db';
import { scrapedProjects, professors } from '../drizzle/schema';
import { sql, eq } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🏷️  Updating CS professors tags from scraped_projects...\n');
  
  // Get all CS professors from scraped_projects
  const scrapedCS = await db
    .select()
    .from(scrapedProjects)
    .where(sql`major_name LIKE '%Computer Science%'`);
  
  console.log(`✅ Found ${scrapedCS.length} records in scraped_projects`);
  
  // Group by professor name and merge tags
  const professorTagsMap = new Map<string, Set<string>>();
  
  for (const record of scrapedCS) {
    if (!record.professorName) {
      console.log('Skipping record with no professor name');
      continue;
    }
    
    if (!record.tags) {
      console.log(`Skipping ${record.professorName} - no tags`);
      continue;
    }
    
    // Parse tags (can be string, array, or object)
    let tags: string[] = [];
    if (typeof record.tags === 'string') {
      // Comma-separated string
      tags = record.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    } else if (Array.isArray(record.tags)) {
      // Already an array
      tags = record.tags.map(t => String(t).trim()).filter(t => t.length > 0);
    } else if (typeof record.tags === 'object' && record.tags !== null) {
      // Object (MySQL JSON type) - convert to string first
      const tagsStr = JSON.stringify(record.tags);
      try {
        const parsed = JSON.parse(tagsStr);
        if (Array.isArray(parsed)) {
          tags = parsed.map(t => String(t).trim()).filter(t => t.length > 0);
        } else if (typeof parsed === 'string') {
          tags = parsed.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
      } catch (e) {
        console.log(`Warning: Cannot parse tags for ${record.professorName}`);
        continue;
      }
    } else {
      console.log(`Warning: Unknown tags type for ${record.professorName}:`, typeof record.tags);
      continue;
    }
    
    if (tags.length === 0) {
      console.log(`Skipping ${record.professorName} - empty tags after parsing`);
      continue;
    }
    
    // Merge tags
    if (!professorTagsMap.has(record.professorName)) {
      professorTagsMap.set(record.professorName, new Set());
    }
    
    const existingTags = professorTagsMap.get(record.professorName)!;
    tags.forEach(tag => existingTags.add(tag));
  }
  
  console.log(`✅ Processed ${professorTagsMap.size} unique professors`);
  
  // Update professors table
  let updatedCount = 0;
  let notFoundCount = 0;
  
  for (const [name, tagsSet] of professorTagsMap.entries()) {
    try {
      const tags = Array.from(tagsSet);
      
      // Find professor in professors table
      const prof = await db
        .select()
        .from(professors)
        .where(
          and(
            eq(professors.name, name),
            sql`major_name LIKE '%Computer Science%'`
          )
        )
        .limit(1);
      
      if (prof.length === 0) {
        console.log(`⚠️  Not found in professors table: ${name}`);
        notFoundCount++;
        continue;
      }
      
      // Update tags and researchInterests
      await db
        .update(professors)
        .set({
          tags: JSON.stringify(tags),
          researchInterests: JSON.stringify(tags) // Use tags as research interests
        })
        .where(eq(professors.id, prof[0].id));
      
      console.log(`✅ Updated: ${name} (${tags.length} tags)`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error updating ${name}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Total professors with tags: ${professorTagsMap.size}`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Not found: ${notFoundCount}`);
  console.log('='.repeat(60));
}

import { and } from 'drizzle-orm';

main()
  .then(() => {
    console.log('\n✅ Update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });
