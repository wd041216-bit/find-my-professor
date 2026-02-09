import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { invokeLLM } from './server/_core/llm';

async function extractFacultyList(html: string) {
  console.log('[Test] Extracting faculty list from HTML...');
  console.log(`HTML length: ${html.length} characters`);
  
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

  console.log('[LLM] Calling LLM to extract faculty list...');
  
  const response = await invokeLLM({
    messages: [
      { 
        role: 'system', 
        content: 'You are a web scraping assistant. Extract faculty information from HTML and return valid JSON.' 
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1
  });
  
  const content = response.choices[0].message.content;
  
  console.log('[LLM] Response received');
  console.log(`Response length: ${content.length} characters`);
  
  // 提取JSON
  const startIdx = content.indexOf('[');
  const endIdx = content.lastIndexOf(']');
  
  if (startIdx === -1 || endIdx === -1) {
    console.log('[Error] No JSON array found in response');
    console.log('Response:', content);
    throw new Error('No JSON array found in LLM response');
  }
  
  const jsonStr = content.substring(startIdx, endIdx + 1);
  const professors = JSON.parse(jsonStr);
  
  console.log(`[Result] Extracted ${professors.length} professors`);
  
  // 保存结果
  const filename = '/home/ubuntu/professors-list.json';
  writeFileSync(filename, JSON.stringify(professors, null, 2));
  console.log(`[Saved] Professors list saved to ${filename}`);
  
  return professors;
}

// 测试
const html = readFileSync('/home/ubuntu/faculty-page.html', 'utf-8');

extractFacultyList(html)
  .then(professors => {
    console.log('\n✅ Success! Extracted professors:');
    professors.slice(0, 5).forEach((p: any, i: number) => {
      console.log(`${i + 1}. ${p.name}${p.url ? ` - ${p.url}` : ''}`);
    });
    if (professors.length > 5) {
      console.log(`... and ${professors.length - 5} more`);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
