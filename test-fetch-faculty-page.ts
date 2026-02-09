import 'dotenv/config';
import { writeFileSync } from 'fs';

async function fetchFacultyPage(url: string) {
  console.log('[Test] Fetching faculty page...');
  console.log(`URL: ${url}`);

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
  
  console.log(`[Result] HTML length: ${html.length} characters`);
  
  // 保存HTML到文件供检查
  const filename = '/home/ubuntu/faculty-page.html';
  writeFileSync(filename, html);
  console.log(`[Saved] HTML saved to ${filename}`);
  
  return html;
}

// 测试
const facultyUrl = 'http://ischool.uw.edu/people/faculty';

fetchFacultyPage(facultyUrl)
  .then(html => {
    console.log('\n✅ Success! Faculty page fetched');
    console.log(`HTML preview (first 1000 chars):\n${html.substring(0, 1000)}...`);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
