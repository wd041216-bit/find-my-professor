/**
 * Script to insert professor data into the database
 */

import fs from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2';

interface Professor {
  name: string;
  title: string;
  department: string;
  universityName: string;
  email: string | null;
  researchAreas: string;
  tags: string[];
  profileUrl: string | null;
}

async function main() {
  // Read professor data
  const professorsData: Professor[] = JSON.parse(
    fs.readFileSync('/home/ubuntu/professors_data.json', 'utf-8')
  );

  console.log(`Loaded ${professorsData.length} professors from JSON file`);

  // Connect to database using raw mysql2
  const poolConnection = mysql.createPool(process.env.DATABASE_URL!);
  const promisePool = poolConnection.promise();
  
  try {
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const prof of professorsData) {
      try {
        // Check if professor already exists (by name and department)
        const [existing] = await promisePool.execute(
          'SELECT id FROM professors WHERE name = ? AND department = ?',
          [prof.name, prof.department]
        );

        if ((existing as any[]).length > 0) {
          console.log(`  Skipped: ${prof.name} (already exists)`);
          skipped++;
          continue;
        }

        // Insert professor
        await promisePool.execute(
          `INSERT INTO professors (
            name, title, department, university_name, 
            research_areas, tags
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            prof.name,
            prof.title,
            prof.department,
            prof.universityName,
            prof.researchAreas,
            JSON.stringify(prof.tags),
          ]
        );

        console.log(`  Inserted: ${prof.name} (${prof.department})`);
        inserted++;
      } catch (error: any) {
        console.error(`  Error inserting ${prof.name}:`, error.message);
        errors++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total professors: ${professorsData.length}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped (already exists): ${skipped}`);
    console.log(`Errors: ${errors}`);
  } finally {
    await promisePool.end();
  }
}

main().catch(console.error);
