/**
 * 测试学生画像tags提取功能
 */

import { extractStudentTags, type StudentProfile } from './server/services/studentTagsService';

async function testStudentTagsExtraction() {
  console.log('================================================================================');
  console.log('🧪 Testing Student Tags Extraction');
  console.log('================================================================================\n');

  // 测试案例1：完整画像
  const completeProfile: StudentProfile = {
    academicBackground: 'Computer Science major, GPA 3.8',
    targetMajor: 'Human-Computer Interaction',
    researchInterests: 'I am interested in using machine learning to improve user experience design, especially in mobile applications. I want to explore how AI can personalize interfaces.',
    skills: ['Python', 'JavaScript', 'React', 'TensorFlow', 'UI/UX Design'],
    activities: 'Led a team project building an AI-powered study app, participated in hackathons'
  };

  console.log('Test Case 1: Complete Profile');
  console.log('---');
  const tags1 = await extractStudentTags(completeProfile);
  console.log('Extracted Tags:', tags1);
  console.log('\n');

  // 测试案例2：最小画像
  const minimalProfile: StudentProfile = {
    targetMajor: 'Physics',
    researchInterests: 'Quantum computing and quantum information theory'
  };

  console.log('Test Case 2: Minimal Profile');
  console.log('---');
  const tags2 = await extractStudentTags(minimalProfile);
  console.log('Extracted Tags:', tags2);
  console.log('\n');

  console.log('================================================================================');
  console.log('✅ Test completed');
  console.log('================================================================================');
}

testStudentTagsExtraction().catch(console.error);
