import { getDb } from '../server/db';
import { scrapedProjects, professors } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('📊 Checking CS professors data...\n');
  
  // Check scraped_projects
  const scrapedCS = await db
    .select()
    .from(scrapedProjects)
    .where(sql`major_name LIKE '%Computer Science%'`);
  
  console.log(`✅ CS professors in scraped_projects: ${scrapedCS.length}`);
  console.log('\nFirst 10:');
  scrapedCS.slice(0, 10).forEach((prof, idx) => {
    console.log(`${idx + 1}. ${prof.professorName} (${prof.position || 'N/A'})`);
  });
  
  // Check Information School
  const scrapedIS = await db
    .select()
    .from(scrapedProjects)
    .where(sql`major_name LIKE '%Information%'`);
  
  console.log(`\n✅ Information School professors in scraped_projects: ${scrapedIS.length}`);
  
  // Check professors table
  const profCS = await db
    .select()
    .from(professors)
    .where(sql`major_name LIKE '%Computer Science%'`);
  
  console.log(`\n✅ CS professors in professors table: ${profCS.length}`);
  
  const profIS = await db
    .select()
    .from(professors)
    .where(sql`major_name LIKE '%Information%'`);
  
  console.log(`✅ Information School professors in professors table: ${profIS.length}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   scraped_projects: ${scrapedCS.length} CS + ${scrapedIS.length} IS = ${scrapedCS.length + scrapedIS.length} total`);
  console.log(`   professors table: ${profCS.length} CS + ${profIS.length} IS = ${profCS.length + profIS.length} total`);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
