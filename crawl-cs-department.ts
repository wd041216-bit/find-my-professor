import { crawlDepartmentProfessors } from './server/services/crawlerService';

/**
 * 测试爬取：Paul G. Allen School of Computer Science & Engineering
 */

async function main() {
  console.log('='.repeat(80));
  console.log('开始爬取 UW Allen School of Computer Science & Engineering');
  console.log('='.repeat(80));
  
  try {
    await crawlDepartmentProfessors(
      'University of Washington',
      'Paul G. Allen School of Computer Science & Engineering'
    );
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 爬取完成！');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ 爬取失败:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
