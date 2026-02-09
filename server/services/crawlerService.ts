import { invokeLLM } from '../_core/llm';
import * as schema from '../../drizzle/schema';
import { getDb } from '../db';

interface Professor {
  name: string;
  url: string | null;
}

interface ProfessorWithTags {
  name: string;
  tags: string[];
}

/**
 * 数据功能（Data Layer）：爬虫找教授 + Perplexity生成tags
 * 
 * 流程：
 * 1. 用Perplexity找faculty页面URL
 * 2. 爬取faculty页面HTML
 * 3. 用LLM提取教授列表
 * 4. 用Perplexity批量生成教授tags
 * 5. 保存到scraped_projects表
 */

/**
 * Step 1: 用Perplexity找faculty页面URL
 */
async function findFacultyPageUrl(university: string, department: string): Promise<string> {
  const prompt = `What is the URL of the faculty directory page for ${university} ${department}?

Return ONLY the URL, no explanation.`;

  console.log(`[DataLayer] Finding faculty page URL for ${university} ${department}...`);

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  });

  const data = await response.json();
  const url = data.choices[0].message.content.trim();
  
  // 移除可能的引用标记 [1]
  const cleanUrl = url.replace(/\[\d+\]$/, '');
  
  console.log(`[DataLayer] Faculty page URL found: ${cleanUrl}`);
  console.log(`[DataLayer] Perplexity tokens: ${data.usage.total_tokens}, cost: $${(data.usage.total_tokens * 0.000005).toFixed(5)}`);
  
  return cleanUrl;
}

/**
 * Step 2: 爬取faculty页面HTML
 */
async function fetchFacultyPage(url: string): Promise<string> {
  console.log(`[DataLayer] Fetching faculty page: ${url}...`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  console.log(`[DataLayer] Faculty page fetched: ${html.length} characters`);
  
  return html;
}

/**
 * Step 3: 用LLM提取教授列表
 */
async function extractFacultyList(html: string): Promise<Professor[]> {
  console.log(`[DataLayer] Extracting faculty list from HTML...`);
  
  // 限制HTML长度避免超token（保留前30000字符）
  const truncatedHtml = html.substring(0, 30000);
  
  const prompt = `Extract all faculty members from this webpage HTML.

HTML content:
${truncatedHtml}

For each faculty member, extract:
1. Full name
2. Personal webpage URL or lab URL (if available)

Return ONLY valid JSON array:
[
  {
    "name": "Professor Full Name",
    "url": "https://..." // or null if not available
  }
]

Skip:
- Emeritus professors
- Visiting scholars
- Administrative staff
- Students`;

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
    console.log('[DataLayer] Error: No JSON array found in LLM response');
    throw new Error('No JSON array found in LLM response');
  }
  
  const jsonStr = content.substring(startIdx, endIdx + 1);
  const professors = JSON.parse(jsonStr);
  
  console.log(`[DataLayer] Extracted ${professors.length} professors`);
  
  return professors;
}

/**
 * Step 4: 用Perplexity批量生成教授tags
 */
async function generateTagsForProfessors(
  professors: Professor[],
  university: string,
  department: string
): Promise<ProfessorWithTags[]> {
  console.log(`[DataLayer] Generating tags for ${professors.length} professors...`);
  
  // 批量处理：每次最多15个教授
  const batchSize = 15;
  const allResults: ProfessorWithTags[] = [];
  
  for (let i = 0; i < professors.length; i += batchSize) {
    const batch = professors.slice(i, i + batchSize);
    
    // 将教授列表格式化
    const professorList = batch.map((p, idx) => 
      `${idx+1}. ${p.name}${p.url ? ` (${p.url})` : ''}`
    ).join('\n');
    
    const prompt = `For each professor below from ${university} ${department}, generate 5-10 research tags (keywords).

Professors:
${professorList}

Tags should be:
- Specific research areas (e.g., "natural language processing", "human-computer interaction")
- Technical methods (e.g., "deep learning", "user studies")
- Application domains (e.g., "healthcare", "education")

Return ONLY valid JSON:
[
  {
    "name": "Professor Name",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  }
]`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { 
            role: 'system', 
            content: 'You are a research assistant. Generate accurate research tags based on real information about professors.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    
    console.log(`[DataLayer] Batch ${Math.floor(i / batchSize) + 1}: Perplexity tokens: ${data.usage.total_tokens}, cost: $${(data.usage.total_tokens * 0.000005).toFixed(5)}`);
    
    const content = data.choices[0].message.content;
    
    // 提取JSON（改进版：处理多种格式）
    try {
      const startIdx = content.indexOf('[');
      const endIdx = content.lastIndexOf(']');
      
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = content.substring(startIdx, endIdx + 1);
        const batchResults = JSON.parse(jsonStr);
        allResults.push(...batchResults);
        console.log(`[DataLayer] Batch ${Math.floor(i / batchSize) + 1}: Successfully parsed ${batchResults.length} professors`);
      } else {
        console.log(`[DataLayer] Warning: No JSON found in batch ${Math.floor(i / batchSize) + 1}`);
        console.log(`[DataLayer] Content: ${content.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`[DataLayer] Error parsing JSON in batch ${Math.floor(i / batchSize) + 1}:`, error);
      console.log(`[DataLayer] Content: ${content}`);
      // 继续处理下一批，不中断整个流程
    }
    
    // 避免API限流
    if (i + batchSize < professors.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`[DataLayer] Generated tags for ${allResults.length} professors`);
  
  return allResults;
}

/**
 * Step 5: 保存到scraped_projects表
 */
async function saveProfessorsToDatabase(
  professorsWithTags: ProfessorWithTags[],
  professors: Professor[],
  university: string,
  department: string
): Promise<void> {
  console.log(`[DataLayer] Saving ${professorsWithTags.length} professors to database...`);
  
  // 合并教授列表和tags
  const professorMap = new Map(professors.map(p => [p.name, p.url]));
  
  const dataToInsert = professorsWithTags.map(p => ({
    universityName: university,
    majorName: department,
    professorName: p.name,
    projectTitle: `${p.name}'s Research`,
    projectDescription: `Research areas: ${p.tags.join(', ')}`,
    sourceUrl: professorMap.get(p.name) || '',
    source: 'scraped' as const,
    searchScope: 'major_specific' as const
  }));
  
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  await db.insert(schema.scrapedProjects).values(dataToInsert);
  
  console.log(`[DataLayer] Successfully saved ${dataToInsert.length} professors to scraped_projects table`);
}

/**
 * 主函数：完整的数据采集流程
 */
export async function crawlDepartmentProfessors(
  university: string,
  department: string
): Promise<void> {
  console.log(`[DataLayer] Starting data collection for ${university} ${department}...`);
  
  try {
    // Step 1: 找faculty页面URL
    const facultyPageUrl = await findFacultyPageUrl(university, department);
    
    // Step 2: 爬取HTML
    const html = await fetchFacultyPage(facultyPageUrl);
    
    // Step 3: 提取教授列表
    const professors = await extractFacultyList(html);
    
    if (professors.length === 0) {
      console.log('[DataLayer] Warning: No professors found');
      return;
    }
    
    // Step 4: 生成tags
    const professorsWithTags = await generateTagsForProfessors(professors, university, department);
    
    if (professorsWithTags.length === 0) {
      console.log('[DataLayer] Warning: No tags generated');
      return;
    }
    
    // Step 5: 保存到数据库
    await saveProfessorsToDatabase(professorsWithTags, professors, university, department);
    
    console.log(`[DataLayer] ✅ Data collection completed for ${university} ${department}`);
    console.log(`[DataLayer] Total professors: ${professorsWithTags.length}`);
    
  } catch (error) {
    console.error(`[DataLayer] ❌ Error during data collection:`, error);
    throw error;
  }
}
