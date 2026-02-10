import { getDb } from "../server/db";
import { professors } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Scrape professor titles using Perplexity API (with web search)
 */

/**
 * Extract professor title using Perplexity API
 */
async function extractTitleWithPerplexity(professorName: string, university: string): Promise<string | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not found in environment');
  }
  
  const prompt = `What is the current academic title/position of ${professorName} at ${university}?

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

Return ONLY the title (e.g., "Associate Professor"), no explanation. If the professor is no longer at this university or not found, return "Not Found".`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Search the web to find accurate professor titles and return only the title text, no explanation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`     ❌ Perplexity API error: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Check if professor was not found
    if (content.toLowerCase().includes('not found')) {
      return 'Not Found';
    }
    
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
    
    // Check if the returned title matches any valid title
    for (const validTitle of validTitles) {
      if (content.toLowerCase().includes(validTitle.toLowerCase())) {
        return validTitle;
      }
    }
    
    // If Perplexity returns something unexpected, log it and default to "Professor"
    console.log(`     ⚠️  Unexpected title "${content}", defaulting to "Professor"`);
    return 'Professor';
    
  } catch (error) {
    console.error(`     ❌ Error calling Perplexity API:`, error);
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
  
  console.log(`🚀 Starting title scraping with Perplexity API for ${university} - ${major}...\n`);
  
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
  let notFound = 0;
  let errors = 0;
  
  for (const prof of filteredProfs) {
    console.log(`\n👤 Processing: ${prof.name}`);
    console.log(`   Current title: ${prof.title || 'NULL'}`);
    console.log(`   Major: ${prof.majorName}`);
    
    // Extract title using Perplexity API
    console.log(`   🔍 Searching with Perplexity...`);
    const title = await extractTitleWithPerplexity(prof.name, university);
    
    if (!title) {
      console.log(`   ❌ Failed to extract title`);
      errors++;
      continue;
    }
    
    if (title === 'Not Found') {
      console.log(`   ⚠️  Professor not found at ${university}`);
      notFound++;
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
    
    // Wait to avoid rate limiting (Perplexity has rate limits)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 Scraping Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  Not Found: ${notFound}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(50));
  
  process.exit(0);
}

main().catch(console.error);
