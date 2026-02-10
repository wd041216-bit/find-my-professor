import { crawlDepartmentProfessors } from './server/services/crawlerService';

/**
 * 批量爬取华盛顿大学各学院教授数据
 * 
 * 优先级分批：
 * - 第一批：STEM热门学院
 * - 第二批：社会科学和商科
 * - 第三批：其他专业学院
 */

const departments = [
  // 第一批：STEM热门学院
  { university: 'University of Washington', department: 'Paul G. Allen School of Computer Science & Engineering', priority: 1 },
  { university: 'University of Washington', department: 'Department of Electrical & Computer Engineering', priority: 1 },
  { university: 'University of Washington', department: 'Department of Bioengineering', priority: 1 },
  { university: 'University of Washington', department: 'Department of Chemical Engineering', priority: 1 },
  { university: 'University of Washington', department: 'Department of Mechanical Engineering', priority: 1 },
  { university: 'University of Washington', department: 'School of Medicine', priority: 1 },
  { university: 'University of Washington', department: 'Department of Biology', priority: 1 },
  { university: 'University of Washington', department: 'Department of Chemistry', priority: 1 },
  { university: 'University of Washington', department: 'Department of Physics', priority: 1 },
  { university: 'University of Washington', department: 'Department of Mathematics', priority: 1 },
  { university: 'University of Washington', department: 'Department of Statistics', priority: 1 },
  
  // 第二批：社会科学和商科
  { university: 'University of Washington', department: 'Michael G. Foster School of Business', priority: 2 },
  { university: 'University of Washington', department: 'Department of Economics', priority: 2 },
  { university: 'University of Washington', department: 'Department of Psychology', priority: 2 },
  { university: 'University of Washington', department: 'School of Public Health', priority: 2 },
  { university: 'University of Washington', department: 'School of Law', priority: 2 },
  { university: 'University of Washington', department: 'Department of Political Science', priority: 2 },
  { university: 'University of Washington', department: 'Department of Sociology', priority: 2 },
  
  // 第三批：其他专业学院
  { university: 'University of Washington', department: 'School of Nursing', priority: 3 },
  { university: 'University of Washington', department: 'School of Pharmacy', priority: 3 },
  { university: 'University of Washington', department: 'College of Education', priority: 3 },
  { university: 'University of Washington', department: 'School of Social Work', priority: 3 },
  { university: 'University of Washington', department: 'College of Built Environments', priority: 3 },
  { university: 'University of Washington', department: 'School of Dentistry', priority: 3 },
];

async function main() {
  console.log('='.repeat(80));
  console.log('开始批量爬取华盛顿大学各学院教授数据');
  console.log('='.repeat(80));
  
  // 按优先级分组
  const priorityGroups = [
    departments.filter(d => d.priority === 1),
    departments.filter(d => d.priority === 2),
    departments.filter(d => d.priority === 3),
  ];
  
  const priorityNames = ['STEM热门学院', '社会科学和商科', '其他专业学院'];
  
  for (let i = 0; i < priorityGroups.length; i++) {
    const group = priorityGroups[i];
    console.log('\n' + '='.repeat(80));
    console.log(`第${i + 1}批：${priorityNames[i]}（共${group.length}个学院）`);
    console.log('='.repeat(80));
    
    for (const dept of group) {
      try {
        console.log(`\n[${dept.department}] 开始爬取...`);
        await crawlDepartmentProfessors(dept.university, dept.department);
        console.log(`[${dept.department}] ✅ 完成`);
        
        // 避免API限流，每个学院之间间隔3秒
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`[${dept.department}] ❌ 失败:`, error);
        // 继续处理下一个学院
      }
    }
    
    console.log(`\n第${i + 1}批完成！`);
    
    // 每批之间间隔10秒
    if (i < priorityGroups.length - 1) {
      console.log('等待10秒后开始下一批...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 所有学院爬取完成！');
  console.log('='.repeat(80));
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
