import { getDb } from './server/db';
import { scrapedProjects } from './drizzle/schema';
import { and, eq } from 'drizzle-orm';

async function checkTagsFormat() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    return;
  }
  
  const professors = await db
    .select()
    .from(scrapedProjects)
    .where(
      and(
        eq(scrapedProjects.universityName, 'University of Washington'),
        eq(scrapedProjects.majorName, 'Information School')
      )
    )
    .limit(3);

  console.log('================================================================================');
  console.log('🔍 Checking Tags Format in Database');
  console.log('================================================================================\n');
  
  professors.forEach((prof, index) => {
    console.log(`${index + 1}. ${prof.professorName}`);
    console.log(`   Tags Type: ${typeof prof.tags}`);
    console.log(`   Tags Value: ${JSON.stringify(prof.tags)}`);
    
    if (Array.isArray(prof.tags)) {
      console.log(`   Tags Array Length: ${prof.tags.length}`);
      console.log(`   First 3 Tags: ${prof.tags.slice(0, 3).join(', ')}`);
    }
    console.log('');
  });
  
  process.exit(0);
}

checkTagsFormat();
