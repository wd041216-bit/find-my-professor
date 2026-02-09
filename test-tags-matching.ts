/**
 * 测试基于tags的匹配算法
 */

import { calculateMatchScore, getMatchedTags, rankProfessorsByMatch } from './server/services/tagsMatchingService';

function testMatchingAlgorithm() {
  console.log('================================================================================');
  console.log('🧪 Testing Tags Matching Algorithm');
  console.log('================================================================================\n');

  // 学生tags
  const studentTags = [
    'human-computer-interaction',
    'machine-learning',
    'user-experience-design',
    'mobile-applications',
    'artificial-intelligence'
  ];

  console.log('Student Tags:', studentTags);
  console.log('\n');

  // 测试教授1：高匹配度
  const prof1Tags = [
    'human-computer-interaction',
    'machine-learning',
    'user-interface-design',
    'mobile-computing',
    'ai-applications'
  ];

  const score1 = calculateMatchScore(studentTags, prof1Tags);
  const matched1 = getMatchedTags(studentTags, prof1Tags);
  console.log('Professor 1 (High Match):');
  console.log('  Tags:', prof1Tags);
  console.log('  Match Score:', score1);
  console.log('  Matched Tags:', matched1);
  console.log('\n');

  // 测试教授2：中等匹配度
  const prof2Tags = [
    'data-science',
    'machine-learning',
    'natural-language-processing',
    'computer-vision'
  ];

  const score2 = calculateMatchScore(studentTags, prof2Tags);
  const matched2 = getMatchedTags(studentTags, prof2Tags);
  console.log('Professor 2 (Medium Match):');
  console.log('  Tags:', prof2Tags);
  console.log('  Match Score:', score2);
  console.log('  Matched Tags:', matched2);
  console.log('\n');

  // 测试教授3：低匹配度
  const prof3Tags = [
    'quantum-computing',
    'quantum-mechanics',
    'theoretical-physics'
  ];

  const score3 = calculateMatchScore(studentTags, prof3Tags);
  const matched3 = getMatchedTags(studentTags, prof3Tags);
  console.log('Professor 3 (Low Match):');
  console.log('  Tags:', prof3Tags);
  console.log('  Match Score:', score3);
  console.log('  Matched Tags:', matched3);
  console.log('\n');

  // 测试排序功能
  const professors = [
    {
      professorName: 'Prof. Quantum',
      projectTitle: 'Quantum Computing Research',
      tags: prof3Tags,
      sourceUrl: 'http://example.com/prof3'
    },
    {
      professorName: 'Prof. HCI',
      projectTitle: 'HCI and ML Research',
      tags: prof1Tags,
      sourceUrl: 'http://example.com/prof1'
    },
    {
      professorName: 'Prof. DataScience',
      projectTitle: 'Data Science Lab',
      tags: prof2Tags,
      sourceUrl: 'http://example.com/prof2'
    }
  ];

  console.log('================================================================================');
  console.log('Testing Ranking Function');
  console.log('================================================================================\n');

  const rankedResults = rankProfessorsByMatch(studentTags, professors);
  
  rankedResults.forEach((result, index) => {
    console.log(`Rank ${index + 1}: ${result.professorName}`);
    console.log(`  Project: ${result.projectTitle}`);
    console.log(`  Match Score: ${result.matchScore}`);
    console.log(`  Matched Tags: ${result.matchedTags.join(', ')}`);
    console.log('');
  });

  console.log('================================================================================');
  console.log('✅ Test completed');
  console.log('================================================================================');
}

testMatchingAlgorithm();
