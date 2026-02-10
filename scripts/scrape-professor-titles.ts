import { getDb } from "../server/db";
import { professors } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../server/_core/llm";

/**
 * Scrape professor titles from their personal pages
 * 
 * Strategy:
 * 1. Get professors from database (filter by university/major)
 * 2. For each professor with sourceUrl, fetch their personal page
 * 3. Use LLM to extract title from HTML
 * 4. Update database with extracted title
 */

interface ProfessorTitle {
  name: string;
  title: string;
}

/**
 * Extract professor title from HTML using LLM
 */
async function extractTitleFromHtml(html: string, professorName: string): Promise<string | null> {
  // Limit HTML length to avoid token limits (keep first 10000 characters)
  const truncatedHtml = html.substring(0, 10000);
  
  const prompt = `Extract the academic title/position for ${professorName} from this webpage HTML.

HTML content:
${truncatedHtml}

Look for titles like:
- Professor
- Associate Professor
- Assistant Professor
- Research Professor
- Teaching Professor
- Clinical Professor
- Professor Emeritus
- Affiliate Professor
- Adjunct Professor
- Lecturer
- Senior Lecturer

Return ONLY the title, no explanation. If not found, return "Professor".`;

  try {
    const response = await invokeLLM({
      messages: [
        { 
          role: 'system', 
          content: 'You are a web scraping assistant. Extract professor titles from HTML and return only the title text.' 
        },
        { role: 'user', content: prompt }
      ]
    });
    
    const content = response.choices[0].message.content as string;
    const title = content.trim();
    
    // Validate title
    const validTitles = [
      'Professor',
      'Associate Professor',
      'Assistant Professor',
      'Research Professor',
      'Teaching Professor',
      'Clinical Professor',
      'Professor Emeritus',
      'Affiliate Professor',
      'Adjunct Professor',
      'Lecturer',
      'Senior Lecturer'
    ];
    
    if (validTitles.includes(title)) {
      return title;
    }
    
    // If LLM returns something unexpected, default to "Professor"
    console.log(`     ⚠️  Unexpected title "${title}", defaulting to "Professor"`);
    return 'Professor';
    
  } catch (error) {
    console.error(`     ❌ Error extracting title:`, error);
    return null;
  }
}

/**
 * Fetch professor's personal page
 */
async function fetchProfessorPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      console.error(`     ❌ HTTP error! status: ${response.status}`);
      return null;
    }

    const html = await response.text();
    return html;
    
  } catch (error) {
    console.error(`     ❌ Error fetching page:`, error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const university = args[0] || 'University of Washington';
  const major = args[1] || 'Information School';
  
  console.log(`🚀 Starting title scraping for ${university} - ${major}...\n`);
  
  // Step 1: Get professors from database
  console.log('📊 Fetching professors from database...');
  const profs = await db
    .select()
    .from(professors)
    .where(eq(professors.universityName, university))
    .execute();
  
  // Filter by major if specified
  const filteredProfs = major 
    ? profs.filter(p => p.majorName === major)
    : profs;
  
  console.log(`Found ${filteredProfs.length} professors\n`);
  
  // Step 2: Process each professor
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const prof of filteredProfs) {
    console.log(`\n👤 Processing: ${prof.name}`);
    console.log(`   Current title: ${prof.title || 'NULL'}`);
    console.log(`   Source URL: ${prof.sourceUrl || 'N/A'}`);
    
    // Skip if no source URL
    if (!prof.sourceUrl) {
      console.log(`   ⏭️  Skipped (no source URL)`);
      skipped++;
      continue;
    }
    
    // Convert relative URL to absolute URL
    let fullUrl = prof.sourceUrl;
    if (prof.sourceUrl.startsWith('/')) {
      // For UW Information School, the base URL is https://ischool.uw.edu
      fullUrl = `https://ischool.uw.edu${prof.sourceUrl}`;
      console.log(`   📍 Converted to full URL: ${fullUrl}`);
    }
    
    // Fetch professor's page
    console.log(`   🌐 Fetching personal page...`);
    const html = await fetchProfessorPage(fullUrl);
    
    if (!html) {
      console.log(`   ❌ Failed to fetch page`);
      errors++;
      continue;
    }
    
    console.log(`   📄 Page fetched (${html.length} characters)`);
    
    // Extract title using LLM
    console.log(`   🤖 Extracting title with LLM...`);
    const title = await extractTitleFromHtml(html, prof.name);
    
    if (!title) {
      console.log(`   ❌ Failed to extract title`);
      errors++;
      continue;
    }
    
    console.log(`   ✅ Extracted title: ${title}`);
    
    // Update database
    try {
      await db
        .update(professors)
        .set({ title: title })
        .where(eq(professors.id, prof.id))
        .execute();
      
      console.log(`   💾 Database updated`);
      updated++;
      
    } catch (error) {
      console.error(`   ❌ Error updating database:`, error);
      errors++;
    }
    
    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 Scraping Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(50));
  
  process.exit(0);
}

main().catch(console.error);
