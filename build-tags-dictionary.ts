/**
 * 构建tags词典脚本
 * 从华盛顿大学Information School的教授数据中提取tags并填充词典
 */

import { buildTagsDictionary, getDictionaryStats } from './server/services/tagsDictionaryService';

async function main() {
  console.log('================================================================================');
  console.log('🏗️  Building Tags Dictionary');
  console.log('================================================================================\n');

  const universityName = 'University of Washington';
  const majorName = 'Information School';

  console.log(`University: ${universityName}`);
  console.log(`Major: ${majorName}\n`);

  // 构建词典
  const tagsCount = await buildTagsDictionary(universityName, majorName);
  
  console.log(`\n✅ Dictionary built successfully with ${tagsCount} tags\n`);

  // 获取统计信息
  const stats = await getDictionaryStats(universityName, majorName);
  
  console.log('================================================================================');
  console.log('📊 Dictionary Statistics');
  console.log('================================================================================');
  console.log(`Total Tags: ${stats.totalTags}`);
  console.log(`Average Frequency: ${stats.avgFrequency.toFixed(2)}`);
  console.log('\nTop 10 Most Frequent Tags:');
  stats.topTags.forEach((tag, index) => {
    console.log(`  ${index + 1}. ${tag.tag} (used by ${tag.frequency} professors)`);
  });
  console.log('================================================================================\n');

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
