import { getDb } from '../server/db';
import { professors, researchFieldImages } from '../drizzle/schema';
import fs from 'fs';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🔍 Analyzing tags coverage for all professors...\n');
  
  // Get all professors
  const allProfessors = await db.select().from(professors);
  console.log(`✅ Total professors: ${allProfessors.length}`);
  
  // Get all research fields
  const allFields = await db.select().from(researchFieldImages);
  console.log(`✅ Total research fields: ${allFields.length}\n`);
  
  // Collect all unique tags
  const allTagsSet = new Set<string>();
  const tagFrequency = new Map<string, number>();
  
  let professorsWithTags = 0;
  let professorsWithoutTags = 0;
  let professorsWithFields = 0;
  let professorsWithoutFields = 0;
  
  for (const prof of allProfessors) {
    if (prof.tags) {
      professorsWithTags++;
      try {
        const tags: string[] = JSON.parse(prof.tags as string);
        for (const tag of tags) {
          const normalizedTag = tag.trim();
          allTagsSet.add(normalizedTag);
          tagFrequency.set(normalizedTag, (tagFrequency.get(normalizedTag) || 0) + 1);
        }
      } catch (error) {
        console.error(`❌ Error parsing tags for ${prof.name}:`, error);
      }
    } else {
      professorsWithoutTags++;
    }
    
    if (prof.researchField) {
      professorsWithFields++;
    } else {
      professorsWithoutFields++;
    }
  }
  
  console.log('='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Professors with tags: ${professorsWithTags}`);
  console.log(`   Professors without tags: ${professorsWithoutTags}`);
  console.log(`   Professors with research field: ${professorsWithFields}`);
  console.log(`   Professors without research field: ${professorsWithoutFields}`);
  console.log(`   Total unique tags: ${allTagsSet.size}`);
  console.log('='.repeat(60));
  
  // Sort tags by frequency
  const sortedTags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1]);
  
  console.log('\n📋 Top 50 Most Frequent Tags:');
  for (let i = 0; i < Math.min(50, sortedTags.length); i++) {
    const [tag, count] = sortedTags[i];
    console.log(`   ${i + 1}. ${tag}: ${count} professors`);
  }
  
  // Group professors by research field
  console.log('\n📊 Professors by Research Field:');
  const fieldDistribution = new Map<string, number>();
  
  for (const prof of allProfessors) {
    if (prof.researchField) {
      fieldDistribution.set(
        prof.researchField,
        (fieldDistribution.get(prof.researchField) || 0) + 1
      );
    }
  }
  
  for (const field of allFields) {
    const count = fieldDistribution.get(field.fieldName) || 0;
    console.log(`   ${field.fieldName}: ${count} professors`);
  }
  
  // List professors without research field
  console.log('\n⚠️  Professors without Research Field:');
  const unclassifiedProfs = allProfessors.filter(p => !p.researchField);
  
  for (const prof of unclassifiedProfs) {
    let tags: string[] = [];
    try {
      if (prof.tags) {
        tags = JSON.parse(prof.tags as string);
      }
    } catch (error) {
      // ignore
    }
    console.log(`   - ${prof.name} (${prof.majorName})`);
    console.log(`     Tags: ${tags.slice(0, 5).join(', ')}${tags.length > 5 ? '...' : ''}`);
  }
  
  // Save all tags to file for LLM analysis
  const allTagsArray = Array.from(allTagsSet).sort();
  const tagData = {
    total_professors: allProfessors.length,
    professors_with_tags: professorsWithTags,
    professors_without_tags: professorsWithoutTags,
    professors_with_fields: professorsWithFields,
    professors_without_fields: professorsWithoutFields,
    total_unique_tags: allTagsSet.size,
    all_tags: allTagsArray,
    tag_frequency: Object.fromEntries(sortedTags),
    research_fields: allFields.map(f => f.fieldName),
    unclassified_professors: unclassifiedProfs.map(p => ({
      name: p.name,
      major: p.majorName,
      tags: p.tags ? JSON.parse(p.tags as string) : []
    }))
  };
  
  fs.writeFileSync(
    '/home/ubuntu/all-professor-tags-analysis.json',
    JSON.stringify(tagData, null, 2)
  );
  
  console.log('\n✅ Analysis saved to /home/ubuntu/all-professor-tags-analysis.json');
}

main()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
