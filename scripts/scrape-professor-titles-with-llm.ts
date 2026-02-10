import { getDb } from "../server/db";
import { professors } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../server/_core/llm";

/**
 * Scrape professor titles using LLM with web search
 * 
 * Strategy:
 * 1. Get professors from database (filter by university/major)
 * 2. For each professor, use LLM with web search to find their current title
 * 3. Update database with extracted title
 */

/**
 * Extract professor title using LLM with web search
 */
async function extractTitleWithWebSearch(professorName: string, university: string): Promise<string | null> {
  const prompt = `Search the web and find the current academic title/position for ${professorName} at ${university}.

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

Return ONLY the title, no explanation. If the professor is no longer at this university or not found, return "Not Found".`;

  try {
    const response = await invokeLLM({
      messages: [
        { 
          role: 'system', 
          content: 'You are a research assistant. Based on the search query, extract the professor\'s current academic title and return only the title text.' 
        },
        { role: 'user', content: prompt }
      ]
    });
    
    const content = response.choices[0].message.content as string;
    const title = content.trim();
    
    // Check if professor was not found
    if (title.toLowerCase().includes('not found')) {
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
      if (title.toLowerCase().includes(validTitle.toLowerCase())) {
        return validTitle;
      }
    }
    
    // If LLM returns something unexpected, log it and default to "Professor"
    console.log(`     ⚠️  Unexpected title "${title}", defaulting to "Professor"`);
    return 'Professor';
    
  } catch (error) {
    console.error(`     ❌ Error extracting title:`, error);
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
  
  console.log(`🚀 Starting title scraping with LLM web search for ${university} - ${major}...\n`);
  
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
    
    // Extract title using LLM with web search
    console.log(`   🔍 Searching web with LLM...`);
    const title = await extractTitleWithWebSearch(prof.name, university);
    
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
    
    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
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
