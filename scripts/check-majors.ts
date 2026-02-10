import { getDb } from '../server/db';
import { professors } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

async function checkMajors() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }

  // Get all distinct majors for University of Washington
  const majors = await db
    .select({ majorName: professors.majorName })
    .from(professors)
    .where(eq(professors.universityName, 'University of Washington'))
    .groupBy(professors.majorName);

  console.log('\n=== University of Washington Majors ===');
  console.log(`Total: ${majors.length} majors\n`);
  
  majors.forEach((m, index) => {
    console.log(`${index + 1}. "${m.majorName}"`);
  });

  process.exit(0);
}

checkMajors().catch(console.error);
