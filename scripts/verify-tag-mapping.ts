import { getDb } from '../server/db';
import { researchFieldTagMapping, professors } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🔍 Verifying tag mapping in database...\n');
  
  // 1. Check total records
  const allMappings = await db.select().from(researchFieldTagMapping);
  console.log(`✅ Total tag mappings in database: ${allMappings.length}\n`);
  
  // 2. Check for duplicates
  const tagCounts = new Map<string, number>();
  for (const mapping of allMappings) {
    tagCounts.set(mapping.tag, (tagCounts.get(mapping.tag) || 0) + 1);
  }
  
  const duplicates = Array.from(tagCounts.entries()).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log('⚠️  Found duplicate tags:');
    for (const [tag, count] of duplicates) {
      console.log(`   ${tag}: ${count} times`);
    }
  } else {
    console.log('✅ No duplicate tags found\n');
  }
  
  // 3. Test the mapping with sample professor tags
  console.log('🧪 Testing mapping with sample professor tags:\n');
  
  const testTags = [
    'machine learning',
    'human-computer interaction',
    'cryptography',
    'quantum computing',
    'computer vision',
    'natural language processing',
    'data science',
    'algorithms'
  ];
  
  for (const tag of testTags) {
    const mapping = await db
      .select()
      .from(researchFieldTagMapping)
      .where(eq(researchFieldTagMapping.tag, tag.toLowerCase()))
      .limit(1);
    
    if (mapping.length > 0) {
      console.log(`✅ "${tag}" → ${mapping[0].researchFieldName}`);
    } else {
      console.log(`❌ "${tag}" → NOT FOUND`);
    }
  }
  
  // 4. Check coverage of professor tags
  console.log('\n📊 Checking coverage of professor tags:\n');
  
  const allProfessors = await db.select().from(professors);
  const professorTags = new Set<string>();
  
  for (const prof of allProfessors) {
    if (prof.tags) {
      try {
        const tags: string[] = JSON.parse(prof.tags as string);
        for (const tag of tags) {
          professorTags.add(tag.toLowerCase().trim());
        }
      } catch (error) {
        // ignore
      }
    }
  }
  
  console.log(`✅ Total unique tags from professors: ${professorTags.size}`);
  
  // Check how many professor tags are covered
  const mappedTags = new Set(allMappings.map(m => m.tag.toLowerCase()));
  const coveredTags = Array.from(professorTags).filter(tag => mappedTags.has(tag));
  const uncoveredTags = Array.from(professorTags).filter(tag => !mappedTags.has(tag));
  
  console.log(`✅ Covered tags: ${coveredTags.length}/${professorTags.size} (${Math.round(coveredTags.length / professorTags.size * 100)}%)`);
  
  if (uncoveredTags.length > 0) {
    console.log(`\n⚠️  Uncovered tags (${uncoveredTags.length}):`);
    for (const tag of uncoveredTags.slice(0, 20)) {
      console.log(`   - ${tag}`);
    }
    if (uncoveredTags.length > 20) {
      console.log(`   ... and ${uncoveredTags.length - 20} more`);
    }
  }
  
  // 5. Show field distribution
  console.log('\n📊 Tag Distribution by Research Field:');
  const fieldCounts = new Map<string, number>();
  for (const mapping of allMappings) {
    fieldCounts.set(
      mapping.researchFieldName,
      (fieldCounts.get(mapping.researchFieldName) || 0) + 1
    );
  }
  
  const sortedFields = Array.from(fieldCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [fieldName, count] of sortedFields) {
    console.log(`   ${fieldName}: ${count} tags`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Verification complete!');
  console.log('='.repeat(60));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
