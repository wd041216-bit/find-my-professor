import { getDb } from '../server/db';
import { researchFieldTagMapping } from '../drizzle/schema';
import fs from 'fs';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('📥 Importing tag mapping to database...\n');
  
  // Load the complete tag mapping
  const mappingData = JSON.parse(
    fs.readFileSync('/home/ubuntu/complete-tag-mapping.json', 'utf-8')
  );
  const mapping = mappingData.mapping;
  
  console.log(`✅ Loaded mapping with ${mappingData.total_tags_mapped} tags\n`);
  
  // Prepare batch insert data
  const insertData: Array<{ researchFieldName: string; tag: string }> = [];
  
  for (const [fieldName, tags] of Object.entries(mapping)) {
    for (const tag of tags as string[]) {
      insertData.push({
        researchFieldName: fieldName,
        tag: tag.toLowerCase().trim() // Normalize to lowercase
      });
    }
  }
  
  console.log(`📊 Prepared ${insertData.length} tag mappings for insertion\n`);
  
  // Check if table already has data
  const existingData = await db.select().from(researchFieldTagMapping);
  
  if (existingData.length > 0) {
    console.log(`⚠️  Table already contains ${existingData.length} records`);
    console.log('   Clearing existing data...\n');
    
    // Clear existing data
    await db.delete(researchFieldTagMapping);
    console.log('✅ Existing data cleared\n');
  }
  
  // Batch insert (MySQL has a limit, so we'll do it in chunks)
  const BATCH_SIZE = 100;
  let insertedCount = 0;
  
  for (let i = 0; i < insertData.length; i += BATCH_SIZE) {
    const batch = insertData.slice(i, i + BATCH_SIZE);
    
    try {
      await db.insert(researchFieldTagMapping).values(batch);
      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} records (total: ${insertedCount}/${insertData.length})`);
    } catch (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Total tags to insert: ${insertData.length}`);
  console.log(`   Successfully inserted: ${insertedCount}`);
  console.log('='.repeat(60));
  
  // Verify the data
  const finalCount = await db.select().from(researchFieldTagMapping);
  console.log(`\n✅ Final count in database: ${finalCount.length} records`);
  
  // Show distribution by field
  const fieldCounts = new Map<string, number>();
  for (const record of finalCount) {
    fieldCounts.set(
      record.researchFieldName,
      (fieldCounts.get(record.researchFieldName) || 0) + 1
    );
  }
  
  console.log('\n📊 Tag Distribution by Research Field:');
  const sortedFields = Array.from(fieldCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [fieldName, count] of sortedFields) {
    console.log(`   ${fieldName}: ${count} tags`);
  }
}

main()
  .then(() => {
    console.log('\n✅ Import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
