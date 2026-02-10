import * as fs from 'fs';
import * as schema from './drizzle/schema';
import { getDb } from './server/db';

/**
 * 修复版：正确处理markdown中的空行
 */

interface ProfessorWithTags {
  name: string;
  title: string;
  tags: string[];
}

function parseFacultyMarkdown(content: string): ProfessorWithTags[] {
  const professors: ProfessorWithTags[] = [];
  const lines = content.split('\n');
  
  console.log(`[Parser] Total lines: ${lines.length}`);
  
  const titleKeywords = ['Professor', 'Teaching Professor', 'Associate Professor', 'Assistant Professor'];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    
    // 检查当前行是否是职位标题
    if (currentLine && titleKeywords.some(kw => currentLine === kw || currentLine.includes(kw))) {
      // 向前查找教授姓名（最近的非空行）
      let name = '';
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const prevLine = lines[j].trim();
        if (prevLine && !titleKeywords.some(kw => prevLine.includes(kw))) {
          name = prevLine;
          break;
        }
      }
      
      if (!name) continue;
      
      // 向后查找研究领域（包含分号或逗号的行）
      let tagsLine = '';
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && (nextLine.includes(';') || nextLine.includes(','))) {
          tagsLine = nextLine;
          break;
        }
      }
      
      if (tagsLine) {
        // 支持分号和逗号分隔
        const separator = tagsLine.includes(';') ? ';' : ',';
        const tags = tagsLine
          .split(separator)
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && !tag.includes('http')); // 过滤掉URL
        
        if (tags.length > 0) {
          professors.push({ 
            name, 
            title: currentLine, 
            tags 
          });
        }
      }
    }
  }
  
  return professors;
}

async function saveProfessorsToDatabase(
  professors: ProfessorWithTags[],
  university: string,
  department: string
): Promise<void> {
  console.log(`[Parser] Saving ${professors.length} professors to database...`);
  
  const dataToInsert = professors.map(p => ({
    universityName: university,
    majorName: department,
    professorName: p.name,
    projectTitle: `${p.name}'s Research`,
    projectDescription: `${p.title}. Research areas: ${p.tags.join(', ')}`,
    tags: p.tags,
    sourceUrl: `https://www.cs.washington.edu/people/faculty-members/`,
    source: 'scraped' as const,
    searchScope: 'major_specific' as const
  }));
  
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  await db.insert(schema.scrapedProjects).values(dataToInsert);
  
  console.log(`[Parser] Successfully saved ${dataToInsert.length} professors`);
}

async function main() {
  console.log('='.repeat(80));
  console.log('解析 UW Allen School Faculty Markdown (Fixed Version)');
  console.log('='.repeat(80));
  
  const university = 'University of Washington';
  const department = 'Paul G. Allen School of Computer Science & Engineering';
  const markdownPath = '/home/ubuntu/page_texts/www.cs.washington.edu_people_faculty-members_.md';
  
  try {
    // Step 1: 读取markdown文件
    console.log(`[Parser] Reading markdown file: ${markdownPath}...`);
    const content = fs.readFileSync(markdownPath, 'utf-8');
    console.log(`[Parser] File size: ${content.length} characters`);
    
    // Step 2: 解析教授信息
    const professors = parseFacultyMarkdown(content);
    console.log(`[Parser] Extracted ${professors.length} professors`);
    
    if (professors.length === 0) {
      console.log('[Parser] Warning: No professors found');
      return;
    }
    
    // 显示前5个教授作为示例
    console.log('\n示例教授：');
    professors.slice(0, 5).forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name} (${p.title})`);
      console.log(`   Tags: ${p.tags.join(', ')}`);
    });
    
    // Step 3: 保存到数据库
    await saveProfessorsToDatabase(professors, university, department);
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ 解析完成！共${professors.length}位教授`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ 解析失败:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
