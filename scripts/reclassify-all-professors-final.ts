import { getDb } from "../server/db";

async function reclassifyAllProfessors() {
  console.log("Starting final professor reclassification...\n");
  
  const db = await getDb();
  
  // Step 1: Load tag mapping dictionary
  console.log("Loading tag mapping dictionary...");
  const tagMappingRows: any = await db.execute(
    "SELECT tag, research_field_name FROM research_field_tag_mapping"
  );
  
  const tagToField = new Map<string, string>();
  for (const row of tagMappingRows) {
    if (row.tag && row.research_field_name) {
      tagToField.set(row.tag.toLowerCase().trim(), row.research_field_name);
    }
  }
  
  console.log(`✓ Loaded ${tagToField.size} tag mappings\n`);
  
  // Step 2: Get all professors with tags
  console.log("Fetching all professors...");
  const professors: any = await db.execute(
    "SELECT id, name, tags FROM professors WHERE tags IS NOT NULL AND tags != '[]'"
  );
  
  console.log(`✓ Found ${professors.length} professors with tags\n`);
  
  // Step 3: Classify each professor
  console.log("Classifying professors...");
  let updated = 0;
  let skipped = 0;
  const fieldCounts = new Map<string, number>();
  
  for (const prof of professors) {
    try {
      const tags = JSON.parse(prof.tags);
      
      if (!Array.isArray(tags) || tags.length === 0) {
        skipped++;
        continue;
      }
      
      // Count matches for each research field
      const fieldMatches = new Map<string, number>();
      
      for (const tag of tags) {
        const normalizedTag = tag.toLowerCase().trim();
        const fieldName = tagToField.get(normalizedTag);
        
        if (fieldName) {
          fieldMatches.set(fieldName, (fieldMatches.get(fieldName) || 0) + 1);
        }
      }
      
      if (fieldMatches.size === 0) {
        // No matching field found, skip
        skipped++;
        continue;
      }
      
      // Find field with most matches
      let bestField = "";
      let maxMatches = 0;
      
      for (const [field, count] of fieldMatches.entries()) {
        if (count > maxMatches) {
          maxMatches = count;
          bestField = field;
        }
      }
      
      // Update professor's research field
      await db.execute(
        `UPDATE professors SET research_field = ? WHERE id = ?`,
        [bestField, prof.id]
      );
      
      updated++;
      fieldCounts.set(bestField, (fieldCounts.get(bestField) || 0) + 1);
      
      if (updated % 100 === 0) {
        console.log(`  Processed ${updated}/${professors.length} professors...`);
      }
    } catch (error) {
      console.error(`Error processing professor ${prof.id} (${prof.name}):`, error);
      skipped++;
    }
  }
  
  console.log(`\n✅ Reclassification complete!`);
  console.log(`   Updated: ${updated} professors`);
  console.log(`   Skipped: ${skipped} professors`);
  console.log(`   Total: ${professors.length} professors\n`);
  
  // Step 4: Show distribution
  console.log("Research field distribution:");
  const sortedFields = Array.from(fieldCounts.entries())
    .sort((a, b) => b[1] - a[1]);
  
  for (const [field, count] of sortedFields) {
    console.log(`  ${field}: ${count} professors`);
  }
  
  // Step 5: Verify coverage
  const totalClassified: any = await db.execute(
    "SELECT COUNT(*) as count FROM professors WHERE research_field IS NOT NULL AND research_field != ''"
  );
  
  const totalProfessors: any = await db.execute(
    "SELECT COUNT(*) as count FROM professors"
  );
  
  console.log(`\n📊 Final Statistics:`);
  console.log(`   Total professors: ${totalProfessors[0].count}`);
  console.log(`   Classified: ${totalClassified[0].count}`);
  console.log(`   Coverage: ${((totalClassified[0].count / totalProfessors[0].count) * 100).toFixed(1)}%`);
}

reclassifyAllProfessors()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error reclassifying professors:", error);
    process.exit(1);
  });
