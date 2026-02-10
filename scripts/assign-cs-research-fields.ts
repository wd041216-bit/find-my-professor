import { getDb } from '../server/db';
import { professors, researchFieldImages } from '../drizzle/schema';
import { sql, eq } from 'drizzle-orm';
import { invokeLLM } from '../server/_core/llm';
import fs from 'fs';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🔍 Assigning research fields to CS professors...\n');
  
  // Get all research fields
  const allFields = await db.select().from(researchFieldImages);
  console.log(`✅ Found ${allFields.length} research fields`);
  
  // Get all CS professors
  const csProfessors = await db
    .select()
    .from(professors)
    .where(sql`major_name LIKE '%Computer Science%'`);
  
  console.log(`✅ Found ${csProfessors.length} CS professors\n`);
  
  // Read the classification result
  const classificationResult = JSON.parse(
    fs.readFileSync('/home/ubuntu/cs-field-classification.json', 'utf-8')
  );
  
  // Create a mapping from tags to field names
  const tagToFieldMap = new Map<string, string>();
  
  for (const field of classificationResult.new_fields_needed) {
    for (const tag of field.tags) {
      tagToFieldMap.set(tag.toLowerCase(), field.name);
    }
  }
  
  console.log(`📋 Tag to field mapping: ${tagToFieldMap.size} tags\n`);
  
  // Assign research fields to professors
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const prof of csProfessors) {
    try {
      if (!prof.tags) {
        console.log(`⏭️  Skipped (no tags): ${prof.name}`);
        skippedCount++;
        continue;
      }
      
      // Parse professor tags
      const profTags: string[] = JSON.parse(prof.tags as string);
      
      // Find matching field based on tags
      const fieldCounts = new Map<string, number>();
      
      for (const tag of profTags) {
        const normalizedTag = tag.toLowerCase().trim();
        const fieldName = tagToFieldMap.get(normalizedTag);
        
        if (fieldName) {
          fieldCounts.set(fieldName, (fieldCounts.get(fieldName) || 0) + 1);
        }
      }
      
      if (fieldCounts.size === 0) {
        console.log(`⚠️  No matching field found for: ${prof.name} (tags: ${profTags.slice(0, 3).join(', ')}...)`);
        skippedCount++;
        continue;
      }
      
      // Select the field with the most matching tags
      let bestField = '';
      let maxCount = 0;
      
      for (const [fieldName, count] of fieldCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          bestField = fieldName;
        }
      }
      
      // Find the field ID
      const field = allFields.find(f => f.fieldName === bestField);
      
      if (!field) {
        console.log(`⚠️  Field not found in database: ${bestField} for ${prof.name}`);
        skippedCount++;
        continue;
      }
      
      // Update professor with research field name
      await db
        .update(professors)
        .set({
          researchField: bestField
        })
        .where(eq(professors.id, prof.id));
      
      console.log(`✅ Updated: ${prof.name} → ${bestField} (${maxCount} matching tags)`);
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
  
  // Show distribution
  console.log('\n📊 Field Distribution:');
  const csProfsWithFields = await db
    .select()
    .from(professors)
    .where(sql`major_name LIKE '%Computer Science%' AND research_field IS NOT NULL`);
  
  const fieldCounts = new Map<string, number>();
  for (const prof of csProfsWithFields) {
    if (prof.researchField) {
      fieldCounts.set(prof.researchField, (fieldCounts.get(prof.researchField) || 0) + 1);
    }
  }
  
  for (const [fieldName, count] of fieldCounts.entries()) {
    console.log(`   ${fieldName}: ${count} professors`);
  }
}

main()
  .then(() => {
    console.log('\n✅ Assignment complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Assignment failed:', error);
    process.exit(1);
  });
