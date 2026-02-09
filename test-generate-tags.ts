import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';

interface Professor {
  name: string;
  url: string | null;
}

async function generateTagsForProfessors(professors: Professor[]) {
  console.log('[Test] Generating tags for professors...');
  console.log(`Number of professors: ${professors.length}`);
  
  // 将教授列表格式化
  const professorList = professors.map((p, i) => 
    `${i+1}. ${p.name}${p.url ? ` (${p.url})` : ''}`
  ).join('\n');
  
  const prompt = `For each professor below from University of Washington Information School, generate 5-10 research tags (keywords).

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

  console.log('[Perplexity] Calling Perplexity API...');
  console.log(`Prompt length: ${prompt.length} characters`);
  
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
  
  console.log('[Perplexity] Response received');
  console.log('Usage:', data.usage);
  console.log('Cost:', `$${(data.usage.total_tokens * 0.000005).toFixed(5)}`);
  
  const content = data.choices[0].message.content;
  console.log(`Response length: ${content.length} characters`);
  
  // 提取JSON
  const startIdx = content.indexOf('[');
  const endIdx = content.lastIndexOf(']');
  
  if (startIdx === -1 || endIdx === -1) {
    console.log('[Error] No JSON array found in response');
    console.log('Response:', content);
    throw new Error('No JSON array found in Perplexity response');
  }
  
  const jsonStr = content.substring(startIdx, endIdx + 1);
  const professorsWithTags = JSON.parse(jsonStr);
  
  console.log(`[Result] Generated tags for ${professorsWithTags.length} professors`);
  
  // 保存结果
  const filename = '/home/ubuntu/professors-with-tags.json';
  writeFileSync(filename, JSON.stringify(professorsWithTags, null, 2));
  console.log(`[Saved] Professors with tags saved to ${filename}`);
  
  return professorsWithTags;
}

// 测试
const professors = JSON.parse(readFileSync('/home/ubuntu/professors-list.json', 'utf-8'));

generateTagsForProfessors(professors)
  .then(professorsWithTags => {
    console.log('\n✅ Success! Generated tags for professors:');
    professorsWithTags.slice(0, 3).forEach((p: any, i: number) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   Tags: ${p.tags.join(', ')}`);
    });
    if (professorsWithTags.length > 3) {
      console.log(`\n... and ${professorsWithTags.length - 3} more`);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
