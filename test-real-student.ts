/**
 * 真实学生简历测试
 * 测试Da Wei的简历匹配效果
 */

import { getDb } from './server/db';
import { scrapedProjects } from './drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { extractStudentTags } from './server/services/studentTagsService';
import { rankProfessorsByMatch } from './server/services/tagsMatchingService';
import { getMatchLevel } from './server/services/matchLevelService';
import type { UserProfile } from './server/services/llmMatching';

async function testRealStudent() {
  console.log('================================================================================');
  console.log('🎯 Real Student Resume Test - Da Wei');
  console.log('================================================================================\n');

  // Da Wei的真实简历信息
  const studentProfile: UserProfile = {
    academicLevel: 'undergraduate',
    gpa: undefined, // 简历中未提及
    skills: [
      'Python',
      'R',
      'Java',
      'SQL',
      'Tidyverse',
      'ggplot2',
      'Matplotlib',
      'Pandas',
      'FastAPI',
      'React'
    ],
    interests: [
      'AI Engineering',
      'Data Analysis',
      'Data Visualization',
      'Machine Learning',
      'Natural Language Processing',
      'Educational Technology',
      'Social Media Analysis',
      'Sentiment Analysis'
    ],
    bio: `I am an Informatics student at University of Washington with strong experience in AI engineering and data analysis. 
    
    Currently working as an AI Engineering Intern at Apob AI, where I engineered autonomous search engine alignment systems, designed cost-sensitive circuit breaker protocols, and optimized LLM agent efficiency. I reduced token consumption by 50% and execution time by 70% through strategic implementation.
    
    My projects include developing an AI Teaching Bot with Manim-based animated visualizations, leading a global social media sentiment analysis study processing 10,000+ text entries, and inventing an adjustable-focus lens prototype with a U.S. provisional patent application.
    
    I'm passionate about leveraging AI and data science to solve real-world problems, with particular interest in educational technology, information retrieval, and computational social science.`,
    activities: [
      {
        title: 'AI Engineering Intern at Apob AI',
        category: 'work',
        description: 'Engineered autonomous search engine alignment system, designed circuit breaker protocol, optimized LLM agent efficiency (50% token reduction, 70% time reduction), developed full-stack monitoring dashboard',
        role: 'AI Engineering Intern'
      },
      {
        title: 'AI Teaching Bot',
        category: 'project',
        description: 'Developed pedagogical agent system with step-by-step mathematical explanations and Manim-based animated visualizations',
        role: 'Independent Developer'
      },
      {
        title: 'Global Social Media Sentiment & Addiction Study',
        category: 'research',
        description: 'Processed 10,000+ text entries using R to identify cross-regional emotional patterns and screen-time correlations',
        role: 'Group Leader'
      },
      {
        title: 'Adjustable-Focus Lens Prototype',
        category: 'project',
        description: 'Conceptualized liquid-based adjustable-focus lens mechanism and submitted U.S. provisional patent application',
        role: 'Independent Inventor'
      },
      {
        title: 'UW International Student Association',
        category: 'extracurricular',
        description: 'Active member of the international student community',
        role: 'Active Member'
      }
    ]
  };

  console.log('👤 Student Profile: Da Wei');
  console.log('  University: University of Washington');
  console.log('  Major: Informatics');
  console.log('  Academic Level:', studentProfile.academicLevel);
  console.log('  Skills:', studentProfile.skills?.join(', '));
  console.log('  Interests:', studentProfile.interests?.join(', '));
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
    );

  console.log(`  Found ${professors.length} professors in database`);
  console.log('\n');

  if (professors.length === 0) {
    console.log('❌ No professors found in database');
    return;
  }

  // 过滤出有tags的教授
  const professorsWithTags = professors.filter(p => p.tags && Array.isArray(p.tags) && p.tags.length > 0);
  console.log(`  ${professorsWithTags.length} professors have valid tags`);
  console.log('\n');

  // Step 3: 计算匹配分数并排序
  console.log('🎯 Step 3: Calculating Match Scores and Ranking...');
  const matchResults = rankProfessorsByMatch(
    studentTags,
    professorsWithTags.map(p => ({
      professorName: p.professorName,
      projectTitle: `${p.professorName}'s Research`,
      tags: p.tags as string[],
      sourceUrl: p.sourceUrl || undefined
    }))
  );

  // 显示Top 10结果
  console.log('================================================================================');
  console.log('📊 Top 10 Matching Results');
  console.log('================================================================================\n');

  matchResults.slice(0, 10).forEach((result, index) => {
    const levelInfo = getMatchLevel(result.displayScore);
    const coverageRate = result.matchScore;
    console.log(`${index + 1}. ${result.professorName}`);
    console.log(`   Project: ${result.projectTitle}`);
    console.log(`   Display Score: ${result.displayScore}/100 ${levelInfo.icon}`);
    console.log(`   Coverage Rate: ${coverageRate}% (${result.matchedTags.length} tags matched)`);
    console.log(`   Match Level: ${levelInfo.label} - ${levelInfo.description}`);
    console.log(`   Matched Tags: ${result.matchedTags.join(', ')}`);
    console.log(`   Professor Tags: ${result.professorTags.slice(0, 5).join(', ')}${result.professorTags.length > 5 ? '...' : ''}`);
    console.log(`   URL: ${result.sourceUrl || 'N/A'}`);
    console.log('');
  });

  // 统计数据
  console.log('================================================================================');
  console.log('📈 Statistics');
  console.log('================================================================================\n');
  console.log('Total Professors:', matchResults.length);
  console.log('Average Display Score:', (matchResults.reduce((sum, r) => sum + r.displayScore, 0) / matchResults.length).toFixed(2));
  console.log('Average Coverage Rate:', (matchResults.reduce((sum, r) => sum + r.matchScore, 0) / matchResults.length).toFixed(2) + '%');
  console.log('Highest Display Score:', Math.max(...matchResults.map(r => r.displayScore)));
  console.log('Lowest Display Score:', Math.min(...matchResults.map(r => r.displayScore)));
  
  // 分布统计（基于展示分数）
  const excellentMatch = matchResults.filter(r => r.displayScore >= 85).length;
  const goodMatch = matchResults.filter(r => r.displayScore >= 75 && r.displayScore < 85).length;
  const fairMatch = matchResults.filter(r => r.displayScore >= 60 && r.displayScore < 75).length;
  const lowMatch = matchResults.filter(r => r.displayScore < 60).length;
  
  console.log('\nMatch Distribution (Based on Display Score):');
  console.log(`  🔥 Excellent Match (≥85): ${excellentMatch} professors`);
  console.log(`  ⭐ Good Match (75-84): ${goodMatch} professors`);
  console.log(`  ✓ Fair Match (60-74): ${fairMatch} professors`);
  console.log(`  Low Match (<60): ${lowMatch} professors`);

  console.log('\n================================================================================');
  console.log('✅ Test Completed');
  console.log('================================================================================');

  process.exit(0);
}

testRealStudent().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
