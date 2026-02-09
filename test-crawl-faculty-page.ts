import 'dotenv/config';
import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

async function crawlFacultyPage(url: string) {
  console.log('[Test] Crawling faculty page...');
  console.log(`URL: ${url}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 设置User-Agent避免被识别为爬虫
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('[Crawling] Loading page...');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  
  console.log('[Crawling] Page loaded, extracting HTML...');
  const html = await page.content();
  
  await browser.close();
  
  console.log(`[Result] HTML length: ${html.length} characters`);
  
  // 保存HTML到文件供检查
  const filename = '/home/ubuntu/faculty-page.html';
  writeFileSync(filename, html);
  console.log(`[Saved] HTML saved to ${filename}`);
  
  return html;
}

// 测试
const facultyUrl = 'http://ischool.uw.edu/people/faculty';

crawlFacultyPage(facultyUrl)
  .then(html => {
    console.log('\n✅ Success! Faculty page crawled');
    console.log(`HTML preview (first 500 chars):\n${html.substring(0, 500)}...`);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
