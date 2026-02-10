import * as fs from 'fs';
import * as schema from './drizzle/schema';
import { getDb } from './server/db';

/**
 * 直接解析markdown文件提取教授信息
 * 模式：
 * 教授姓名
 * 职位
 * 研究领域（分号分隔）
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
  
  let matchCount = 0;
  let tagsFoundCount = 0;
  
  for (let i = 0; i < lines.length - 2; i++) {
    const line1 = lines[i].trim();
    const line2 = lines[i + 1].trim();
    const line3 = lines[i + 2].trim();
    
    // 检查是否是教授条目
    // line1: 教授姓名（非空，不包含特殊字符）
    // line2: 职位（包含Professor关键词）
    // line3: 可能是额外职位信息或研究领域
    
    if (line1 && line2 && titleKeywords.some(kw => line2.includes(kw))) {
      matchCount++;
      const name = line1;
      const title = line2;
      
      if (matchCount <= 3) {
        console.log(`[Parser] Match #${matchCount}: ${name} | ${title}`);
      }
      
      // 查找研究领域（包含分号或逗号的行）
      let tagsLine = '';
      for (let j = i + 2; j < Math.min(i + 10, lines.length); j++) {
        const currentLine = lines[j].trim();
        // 检查是否包含分隔符（分号或逗号）且不是空行
        if (currentLine && (currentLine.includes(';') || currentLine.includes(','))) {
          tagsLine = currentLine;
          break;
        }
      }
      
      if (tagsLine) {
        tagsFoundCount++;
        // 支持分号和逗号分隔
        const separator = tagsLine.includes(';') ? ';' : ',';
        const tags = tagsLine
          .split(separator)
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && !tag.includes('http')); // 过滤掉URL
        
        if (tags.length > 0) {
          professors.push({ name, title, tags });
          if (professors.length <= 3) {
            console.log(`[Parser]   -> Tags found: ${tags.join(', ')}`);
          }
        }
      } else if (matchCount <= 3) {
        console.log(`[Parser]   -> No tags found for ${name}`);
      }
    }
  }
  
  console.log(`[Parser] Summary: ${matchCount} professor titles matched, ${tagsFoundCount} with tags found`);
  
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
  console.log('解析 UW Allen School Faculty Markdown');
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
