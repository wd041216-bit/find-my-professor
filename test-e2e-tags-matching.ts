/**
 * 端到端测试：展示基于tags的匹配效果
 * 模拟真实用户场景
 */

import { getDb } from './server/db';
import { scrapedProjects } from './drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { extractStudentTags } from './server/services/studentTagsService';
import { rankProfessorsByMatch } from './server/services/tagsMatchingService';
import type { UserProfile } from './server/services/llmMatching';

async function testE2ETagsMatching() {
  console.log('================================================================================');
  console.log('🎯 End-to-End Tags Matching Test');
  console.log('================================================================================\n');

  // 模拟学生画像
  const studentProfile: UserProfile = {
    academicLevel: 'undergraduate',
    gpa: 3.8,
    skills: ['Python', 'React', 'Machine Learning', 'Data Analysis'],
    interests: ['Human-Computer Interaction', 'AI Applications', 'User Experience Design'],
    bio: 'I am passionate about creating intelligent user interfaces that leverage machine learning to improve user experience.',
    activities: [
      {
        title: 'HCI Research Assistant',
        category: 'research',
        description: 'Conducted user studies on mobile app interfaces',
        role: 'Research Assistant'
      },
      {
        title: 'ML Club President',
        category: 'leadership',
        description: 'Led workshops on machine learning applications',
        role: 'President'
      }
    ]
  };

  console.log('👤 Student Profile:');
  console.log('  Academic Level:', studentProfile.academicLevel);
  console.log('  GPA:', studentProfile.gpa);
  console.log('  Skills:', studentProfile.skills?.join(', '));
  console.log('  Interests:', studentProfile.interests?.join(', '));
  console.log('  Bio:', studentProfile.bio);
  console.log('  Activities:', studentProfile.activities?.length || 0);
  console.log('\n');

  // Step 1: 提取学生tags（使用词典）
  console.log('📋 Step 1: Extracting Student Tags from Dictionary...');
  const universityName = 'University of Washington';
  const majorName = 'Information School';
  const studentTags = await extractStudentTags(studentProfile, universityName, majorName);
  console.log('  Student Tags:', studentTags);
  console.log('\n');

  // Step 2: 从数据库获取教授数据
  console.log('🔍 Step 2: Fetching Professor Data from Database...');
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    return;
  }
  
  const professors = await db
    .select()
    .from(scrapedProjects)
    .where(
      and(
        eq(scrapedProjects.universityName, universityName),
        eq(scrapedProjects.majorName, majorName)
      )
    )
    .limit(20);

  console.log(`  Found ${professors.length} professors in database`);
  console.log('\n');

  if (professors.length === 0) {
    console.log('❌ No professors found in database. Please run crawler first.');
    return;
  }

  // Step 3: 转换为匹配格式
  const professorsForMatching = professors
    .filter(p => p.tags && Array.isArray(p.tags) && p.tags.length > 0)
    .map(p => ({
      professorName: p.professorName || 'Unknown',
      projectTitle: p.projectTitle || 'Research Project',
      tags: p.tags as string[],
      sourceUrl: p.sourceUrl || undefined
    }));

  console.log(`  ${professorsForMatching.length} professors have valid tags`);
  console.log('\n');

  // Step 4: 计算匹配度并排序
  console.log('🎯 Step 3: Calculating Match Scores and Ranking...');
  const rankedResults = rankProfessorsByMatch(studentTags, professorsForMatching);
  console.log('\n');

  // Step 5: 展示Top 10结果
  console.log('================================================================================');
  console.log('📊 Top 10 Matching Results');
  console.log('================================================================================\n');

  const top10 = rankedResults.slice(0, 10);
  
  top10.forEach((result, index) => {
    console.log(`${index + 1}. ${result.professorName}`);
    console.log(`   Project: ${result.projectTitle}`);
    console.log(`   Match Score: ${result.matchScore}/100`);
    console.log(`   Matched Tags: ${result.matchedTags.join(', ') || 'None'}`);
    console.log(`   Professor Tags: ${result.professorTags.slice(0, 5).join(', ')}${result.professorTags.length > 5 ? '...' : ''}`);
    if (result.sourceUrl) {
      console.log(`   URL: ${result.sourceUrl}`);
    }
    console.log('');
  });

  // Step 6: 统计分析
  console.log('================================================================================');
  console.log('📈 Statistics');
  console.log('================================================================================\n');

  const scores = rankedResults.map(r => r.matchScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const highMatchCount = scores.filter(s => s >= 30).length;
  const mediumMatchCount = scores.filter(s => s >= 15 && s < 30).length;
  const lowMatchCount = scores.filter(s => s < 15).length;

  console.log(`Total Professors: ${rankedResults.length}`);
  console.log(`Average Match Score: ${avgScore.toFixed(2)}`);
  console.log(`Highest Score: ${maxScore}`);
  console.log(`Lowest Score: ${minScore}`);
  console.log('');
  console.log('Match Distribution:');
  console.log(`  High Match (≥30): ${highMatchCount} professors`);
  console.log(`  Medium Match (15-29): ${mediumMatchCount} professors`);
  console.log(`  Low Match (<15): ${lowMatchCount} professors`);
  console.log('');

  console.log('================================================================================');
  console.log('✅ Test Completed');
  console.log('================================================================================');
}

// Run test
testE2ETagsMatching().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
