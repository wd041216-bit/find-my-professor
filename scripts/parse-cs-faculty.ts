import fs from 'fs';
import path from 'path';
import { getDb } from '../server/db';
import { scrapedProjects } from '../drizzle/schema';

interface ProfessorData {
  name: string;
  title: string;
  researchInterests: string[];
}

/**
 * 解析CS学院教授markdown文件
 * 文件格式：
 * 
 * Professor Name
 * 
 * Title Line 1
 * 
 * Optional Title Line 2
 * 
 * Research Interest 1; Research Interest 2; Research Interest 3
 * 
 */
function parseProfessorsFromMarkdown(content: string): ProfessorData[] {
  const professors: ProfessorData[] = [];
  const lines = content.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // 跳过空行和导航内容
    if (!line || 
        line.startsWith('Skip to content') ||
        line.startsWith('Our Courses') ||
        line.startsWith('Time Schedules') ||
        line.startsWith('Contact Us') ||
        line.startsWith('Make A Gift') ||
        line.startsWith('Select Language') ||
        line.includes('Afrikaans') ||
        line.includes('Albanian') ||
        line.includes('URL:') ||
        line === '---') {
      i++;
      continue;
    }
    
    // 检测教授姓名：非空行，且下一行是空行或职位描述
    // 教授姓名通常是独立一行，后面跟着空行和职位
    if (line && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const nextNextLine = i + 2 < lines.length ? lines[i + 2].trim() : '';
      
      // 判断是否为教授姓名：
      // 1. 当前行非空
      // 2. 下一行为空或是职位描述（包含Professor/Teaching/Director等关键词）
      const isProfessorName = nextLine === '' || 
                              nextLine.includes('Professor') || 
                              nextLine.includes('Teaching') ||
                              nextLine.includes('Director') ||
                              nextLine.includes('Lecturer');
      
      if (isProfessorName) {
        const professorName = line;
        
        // 跳过空行
        i++;
        while (i < lines.length && lines[i].trim() === '') {
          i++;
        }
        
        // 读取职位（可能有多行）
        const titleLines: string[] = [];
        while (i < lines.length) {
          const titleLine = lines[i].trim();
          if (titleLine === '') {
            break;
          }
          // 如果包含分号，说明是研究兴趣，不是职位
          if (titleLine.includes(';')) {
            break;
          }
          titleLines.push(titleLine);
          i++;
        }
        
        // 跳过空行
        while (i < lines.length && lines[i].trim() === '') {
          i++;
        }
        
        // 读取研究兴趣（包含分号的行）
        let researchInterestsLine = '';
        if (i < lines.length) {
          const interestLine = lines[i].trim();
          if (interestLine.includes(';')) {
            researchInterestsLine = interestLine;
            i++;
          }
        }
        
        // 解析研究兴趣
        const researchInterests = researchInterestsLine
          .split(';')
          .map(interest => interest.trim())
          .filter(interest => interest.length > 0);
        
        // 只添加有效的教授数据
        if (professorName && titleLines.length > 0 && researchInterests.length > 0) {
          professors.push({
            name: professorName,
            title: titleLines.join(' '),
            researchInterests
          });
          
          console.log(`✅ Parsed: ${professorName} (${titleLines.join(' ')}) - ${researchInterests.length} interests`);
        }
        
        continue;
      }
    }
    
    i++;
  }
  
  return professors;
}

/**
 * 将研究兴趣转换为tags（小写，连字符分隔）
 */
function convertInterestsToTags(interests: string[]): string[] {
  return interests.map(interest => 
    interest
      .toLowerCase()
      .replace(/[&]/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  ).filter(tag => tag.length > 0);
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  const markdownPath = '/home/ubuntu/page_texts/www.cs.washington.edu_people_faculty-members_.md';
  
  console.log('📖 Reading markdown file...');
  const content = fs.readFileSync(markdownPath, 'utf-8');
  
  console.log('🔍 Parsing professors...');
  const professors = parseProfessorsFromMarkdown(content);
  
  console.log(`\n✅ Found ${professors.length} professors\n`);
  
  if (professors.length === 0) {
    console.error('❌ No professors found! Check the parsing logic.');
    process.exit(1);
  }
  
  // 显示前5个教授作为示例
  console.log('📋 First 5 professors:');
  professors.slice(0, 5).forEach((prof, idx) => {
    console.log(`\n${idx + 1}. ${prof.name}`);
    console.log(`   Title: ${prof.title}`);
    console.log(`   Interests: ${prof.researchInterests.join(', ')}`);
  });
  
  console.log('\n💾 Inserting into database...');
  
  let insertedCount = 0;
  let skippedCount = 0;
  
  for (const prof of professors) {
    try {
      const tags = convertInterestsToTags(prof.researchInterests);
      
      // 检查是否已存在
      const existing = await db!
        .select()
        .from(scrapedProjects)
        .where(sql`professor_name = ${prof.name} AND university_name = 'University of Washington' AND major_name = 'Paul G. Allen School of Computer Science & Engineering'`)
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`⏭️  Skipped (already exists): ${prof.name}`);
        skippedCount++;
        continue;
      }
      
      await db!.insert(scrapedProjects).values({
        professorName: prof.name,
        universityName: 'University of Washington',
        majorName: 'Paul G. Allen School of Computer Science & Engineering',
        position: prof.title,
        tags: JSON.stringify(tags),
        researchInterests: JSON.stringify(prof.researchInterests),
        sourceUrl: 'https://www.cs.washington.edu/people/faculty-members/',
        acceptingStudents: true,
        createdAt: new Date()
      });
      
      console.log(`✅ Inserted: ${prof.name} (${tags.length} tags)`);
      insertedCount++;
    } catch (error) {
      console.error(`❌ Error inserting ${prof.name}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Total professors found: ${professors.length}`);
  console.log(`   Inserted: ${insertedCount}`);
  console.log(`   Skipped (already exists): ${skippedCount}`);
  console.log('='.repeat(60));
}

// Import sql from drizzle-orm
import { sql } from 'drizzle-orm';

main()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
