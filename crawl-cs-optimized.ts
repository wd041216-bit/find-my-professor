import { invokeLLM } from './server/_core/llm';
import * as schema from './drizzle/schema';
import { getDb } from './server/db';

/**
 * 优化版爬虫：直接从faculty页面提取教授和tags
 * 不使用Perplexity，节省成本并提高准确率
 */

interface ProfessorWithTags {
  name: string;
  title: string;
  tags: string[];
}

async function fetchFacultyPage(url: string): Promise<string> {
  console.log(`[Crawler] Fetching faculty page: ${url}...`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  console.log(`[Crawler] Faculty page fetched: ${html.length} characters`);
  
  return html;
}

async function extractProfessorsWithTags(html: string): Promise<ProfessorWithTags[]> {
  console.log(`[Crawler] Extracting professors and tags from HTML...`);
  
  const prompt = `Extract all faculty members from this webpage HTML.

HTML content:
${html.substring(0, 50000)}

For each faculty member, extract:
1. Full name
2. Title (e.g., "Professor", "Associate Professor", "Assistant Professor")
3. Research areas/tags (the semicolon-separated list after the title)

Return ONLY valid JSON array:
[
  {
    "name": "Professor Full Name",
    "title": "Professor",
    "tags": ["tag1", "tag2", "tag3"]
  }
]

Skip:
- Emeritus professors
- Visiting scholars
- Administrative staff`;

  const response = await invokeLLM({
    messages: [
      { 
        role: 'system', 
        content: 'You are a web scraping assistant. Extract faculty information from HTML and return valid JSON.' 
      },
      { role: 'user', content: prompt }
    ]
  });
  
  const content = response.choices[0].message.content as string;
  
  // 提取JSON
  const startIdx = content.indexOf('[');
  const endIdx = content.lastIndexOf(']');
  
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No JSON array found in LLM response');
  }
  
  const jsonStr = content.substring(startIdx, endIdx + 1);
  const professors = JSON.parse(jsonStr);
  
  console.log(`[Crawler] Extracted ${professors.length} professors with tags`);
  
  return professors;
}

async function saveProfessorsToDatabase(
  professors: ProfessorWithTags[],
  university: string,
  department: string
): Promise<void> {
  console.log(`[Crawler] Saving ${professors.length} professors to database...`);
  
  const dataToInsert = professors
    .filter(p => p.tags && p.tags.length > 0)
    .map(p => ({
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
  
  console.log(`[Crawler] Successfully saved ${dataToInsert.length} professors`);
}

async function main() {
  console.log('='.repeat(80));
  console.log('开始爬取 UW Allen School of Computer Science & Engineering');
  console.log('='.repeat(80));
  
  const university = 'University of Washington';
  const department = 'Paul G. Allen School of Computer Science & Engineering';
  const url = 'https://www.cs.washington.edu/people/faculty-members/';
  
  try {
    // Step 1: 爬取HTML
    const html = await fetchFacultyPage(url);
    
    // Step 2: 提取教授和tags
    const professors = await extractProfessorsWithTags(html);
    
    if (professors.length === 0) {
      console.log('[Crawler] Warning: No professors found');
      return;
    }
    
    // Step 3: 保存到数据库
    await saveProfessorsToDatabase(professors, university, department);
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ 爬取完成！共${professors.length}位教授`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ 爬取失败:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
