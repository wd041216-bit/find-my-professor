import { getDb } from '../server/db';
import { professors } from '../drizzle/schema';
import { and, sql } from 'drizzle-orm';

async function testQuery() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }

  const university = 'University of Washington';
  const major = 'information school';

  console.log('\n=== Testing Case-Insensitive Query ===');
  console.log(`University: "${university}"`);
  console.log(`Major: "${major}"`);

  // Test 1: Original query (exact match)
  console.log('\n--- Test 1: Exact Match ---');
  const exact = await db
    .select()
    .from(professors)
    .where(
      and(
        sql`${professors.universityName} = ${university}`,
        sql`${professors.majorName} = ${major}`
      )
    )
    .limit(5);
  console.log(`Found: ${exact.length} professors`);

  // Test 2: Case-insensitive with LOWER()
  console.log('\n--- Test 2: LOWER() Function ---');
  const lowerCase = await db
    .select()
    .from(professors)
    .where(
      and(
        sql`LOWER(${professors.universityName}) = LOWER(${university})`,
        sql`LOWER(${professors.majorName}) = LOWER(${major})`
      )
    )
    .limit(5);
  console.log(`Found: ${lowerCase.length} professors`);
  if (lowerCase.length > 0) {
    console.log('First professor:', lowerCase[0].name);
  }

  // Test 3: Direct string comparison
  console.log('\n--- Test 3: Direct String in SQL ---');
  const direct = await db
    .select()
    .from(professors)
    .where(
      sql`LOWER(university_name) = 'university of washington' AND LOWER(major_name) = 'information school'`
    )
    .limit(5);
  console.log(`Found: ${direct.length} professors`);
  if (direct.length > 0) {
    console.log('First professor:', direct[0].name);
  }

  process.exit(0);
}

testQuery().catch(console.error);
