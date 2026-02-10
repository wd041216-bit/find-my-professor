import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function testQuery() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }

  const university = 'University of Washington';
  const major = 'information school';
  const limit = 5;

  console.log('\n=== Testing Professor Query with School Images ===');
  console.log(`University: "${university}"`);
  console.log(`Major: "${major}"`);
  console.log(`Limit: ${limit}\n`);

  const professorsList = await db.execute(sql`
    SELECT 
      p.*,
      si.image_url as school_image_url
    FROM professors p
    LEFT JOIN schools s ON LOWER(s.name) = LOWER(p.major_name)
    LEFT JOIN school_images si ON si.school_id = s.id AND si.image_order = 1
    WHERE LOWER(p.university_name) = LOWER(${university}) 
      AND LOWER(p.major_name) = LOWER(${major})
    LIMIT ${limit}
  `);

  const rows = professorsList as any[];
  console.log(`Found ${rows.length} professors\n`);

  rows.forEach((prof, index) => {
    console.log(`\n--- Professor ${index + 1} ---`);
    console.log(`ID: ${prof.id}`);
    console.log(`Name: ${prof.name}`);
    console.log(`Title: ${prof.title}`);
    console.log(`Major: ${prof.major_name}`);
    console.log(`University: ${prof.university_name}`);
    console.log(`School Image URL: ${prof.school_image_url || 'NULL'}`);
    console.log(`Tags: ${prof.tags ? JSON.stringify(prof.tags).substring(0, 100) : 'NULL'}`);
  });

  process.exit(0);
}

testQuery().catch(console.error);
