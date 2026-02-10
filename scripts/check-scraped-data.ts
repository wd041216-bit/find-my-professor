import { getDb } from '../server/db';
import { scrapedProjects } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('📊 Checking scraped_projects data...\n');
  
  // Get a few CS professors
  const samples = await db
    .select()
    .from(scrapedProjects)
    .where(sql`major_name LIKE '%Computer Science%'`)
    .limit(5);
  
  console.log(`Found ${samples.length} sample records:\n`);
  
  samples.forEach((record, idx) => {
    console.log(`${idx + 1}. ${record.professorName}`);
    console.log(`   Position: ${record.position || 'N/A'}`);
    console.log(`   Research Interests: ${record.researchInterests || 'N/A'}`);
    console.log(`   Tags: ${record.tags || 'N/A'}`);
    console.log(`   Research Area: ${record.researchArea || 'N/A'}`);
    console.log('');
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
