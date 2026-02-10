import { getDb } from '../server/db';
import { professors } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

async function checkMapping() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }

  // Get all distinct majors from professors table
  const majors = await db
    .select({ majorName: professors.majorName })
    .from(professors)
    .groupBy(professors.majorName)
    .limit(50);

  console.log('\n=== All Majors in Professors Table ===');
  console.log(`Total: ${majors.length} majors\n`);
  
  majors.forEach((m, index) => {
    console.log(`${index + 1}. "${m.majorName}"`);
  });

  // Get all research fields
  const fields = await db.execute(sql`SELECT field_name FROM research_field_images ORDER BY field_name`);
  
  console.log('\n=== All Research Fields in research_field_images ===');
  console.log(`Total: ${(fields as any).length} fields\n`);
  
  (fields as any).forEach((f: any, index: number) => {
    console.log(`${index + 1}. "${f.field_name}"`);
  });

  process.exit(0);
}

checkMapping().catch(console.error);
