import 'dotenv/config';
import { crawlDepartmentProfessors } from './server/services/crawlerService';

/**
 * 端到端测试：完整的数据采集流程
 * 测试大学：University of Washington
 * 测试Department：Information School
 */

async function testCrawler() {
  console.log('='.repeat(80));
  console.log('🚀 Starting End-to-End Crawler Test');
  console.log('='.repeat(80));
  console.log('');
  
  const university = 'University of Washington';
  const department = 'Information School';
  
  console.log(`University: ${university}`);
  console.log(`Department: ${department}`);
  console.log('');
  
  try {
    const startTime = Date.now();
    
    await crawlDepartmentProfessors(university, department);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('');
    console.log('='.repeat(80));
    console.log(`✅ Test completed successfully in ${duration} seconds`);
    console.log('='.repeat(80));
    console.log('');
    console.log('Next steps:');
    console.log('1. Check scraped_projects table in database');
    console.log('2. Verify professor names and tags');
    console.log('3. Test matching with student profile');
    
  } catch (error) {
    console.log('');
    console.log('='.repeat(80));
    console.log('❌ Test failed');
    console.log('='.repeat(80));
    console.error('Error:', error);
    process.exit(1);
  }
}

testCrawler();
