/**
 * 重新构建词典并应用相似词合并
 * 提高词典效率和匹配准确率
 */

import { getDb } from './server/db';
import { scrapedProjects, researchTagsDictionary } from './drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';
import { mergeSimilarTags, applyMergeRules, generateMergeReport } from './server/services/tagsMergeService';

async function main() {
  console.log('================================================================================');
  console.log('🔄 Rebuilding Tags Dictionary with Similarity Merge');
  console.log('================================================================================\n');

  const universityName = 'University of Washington';
  const majorName = 'Information School';

  console.log(`University: ${universityName}`);
  console.log(`Major: ${majorName}\n`);

  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }

  // Step 1: 从scraped_projects提取所有tags
  console.log('📋 Step 1: Extracting tags from scraped_projects...');
  const professors = await db
    .select()
    .from(scrapedProjects)
    .where(
      and(
        eq(scrapedProjects.universityName, universityName),
        eq(scrapedProjects.majorName, majorName)
      )
    );

  console.log(`  Found ${professors.length} professors\n`);

  // Step 2: 统计tags频率
  console.log('📊 Step 2: Counting tag frequencies...');
  const tagsFrequency = new Map<string, number>();
  
  for (const prof of professors) {
    if (prof.tags && Array.isArray(prof.tags)) {
      for (const tag of prof.tags) {
        tagsFrequency.set(tag, (tagsFrequency.get(tag) || 0) + 1);
      }
    }
  }

  const originalTags = Array.from(tagsFrequency.entries())
    .map(([tag, frequency]) => ({ tag, frequency }))
    .sort((a, b) => b.frequency - a.frequency);

  console.log(`  Found ${originalTags.length} unique tags\n`);

  // Step 3: 识别相似tags并生成合并规则
  console.log('🔍 Step 3: Identifying similar tags...');
  const mergeGroups = await mergeSimilarTags(originalTags);
  console.log(`  Found ${mergeGroups.length} groups of similar tags\n`);

  // Step 4: 应用合并规则
  console.log('🔗 Step 4: Applying merge rules...');
  const mergedTags = applyMergeRules(originalTags, mergeGroups);
  console.log(`  Merged ${originalTags.length} tags → ${mergedTags.length} tags\n`);

  // Step 5: 清空旧词典
  console.log('🗑️  Step 5: Clearing old dictionary...');
  await db
    .delete(researchTagsDictionary)
    .where(
      and(
        eq(researchTagsDictionary.universityName, universityName),
        eq(researchTagsDictionary.majorName, majorName)
      )
    );
  console.log('  Old dictionary cleared\n');

  // Step 6: 插入新词典
  console.log('💾 Step 6: Inserting merged tags into dictionary...');
  const entries = mergedTags.map(({ tag, frequency }) => ({
    universityName,
    majorName,
    tag,
    frequency,
  }));

  if (entries.length > 0) {
    await db.insert(researchTagsDictionary).values(entries);
  }
  console.log(`  Inserted ${entries.length} tags\n`);

  // Step 7: 生成报告
  console.log(generateMergeReport(originalTags.length, mergedTags.length, mergeGroups));

  // Step 8: 显示Top 10 tags
  console.log('================================================================================');
  console.log('🏆 Top 10 Most Frequent Tags (After Merge)');
  console.log('================================================================================\n');
  mergedTags.slice(0, 10).forEach((tag, index) => {
    console.log(`  ${index + 1}. ${tag.tag} (freq: ${tag.frequency})`);
  });
  console.log('\n');

  console.log('================================================================================');
  console.log('✅ Dictionary Rebuilt Successfully');
  console.log('================================================================================');

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
