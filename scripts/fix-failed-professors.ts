import { getDb } from "../server/db";
import { scrapedProjects, professors } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

async function fixFailedProfessors() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Failed to connect to database");
    process.exit(1);
  }
  
  console.log("🚀 Fixing failed professors...\n");
  
  // Get all scraped professors
  const scrapedProfs = await db.select().from(scrapedProjects);
  
  // Get existing professors
  const existingProfs = await db.select().from(professors);
  const existingNames = new Set(
    existingProfs.map(p => `${p.name}|${p.universityName}|${p.majorName}`.toLowerCase())
  );
  
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  
  console.log("🔄 Processing failed professors...\n");
  
  for (const scraped of scrapedProfs) {
    const key = `${scraped.professorName}|${scraped.universityName}|${scraped.majorName}`.toLowerCase();
    
    // Skip if already exists
    if (existingNames.has(key)) {
      skipped++;
      continue;
    }
    
    try {
      // Fix: Ensure researchAreas is never empty array, use null instead
      const researchAreas = scraped.researchArea ? JSON.stringify([scraped.researchArea]) : null;
      const tags = scraped.tags && Array.isArray(scraped.tags) && scraped.tags.length > 0 
        ? JSON.stringify(scraped.tags) 
        : null;
      
      // Insert using raw SQL to avoid Drizzle ORM issues
      await db.execute(sql`
        INSERT INTO professors (
          university_name, major_name, name, department, title,
          research_areas, tags, lab_name, source_url, bio, accepting_students
        ) VALUES (
          ${scraped.universityName},
          ${scraped.majorName},
          ${scraped.professorName || "Unknown"},
          ${scraped.majorName},
          'Professor',
          ${researchAreas},
          ${tags},
          ${scraped.labName || null},
          ${scraped.sourceUrl || null},
          ${scraped.projectDescription || null},
          true
        )
      `);
      
      inserted++;
      
      if (inserted % 10 === 0) {
        console.log(`✅ Fixed ${inserted} professors...`);
      }
    } catch (error: any) {
      errors++;
      if (errors <= 5) {
        console.error(`❌ Error fixing ${scraped.professorName}:`, error.message);
      }
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("📊 Fix Summary:");
  console.log("=".repeat(50));
  console.log(`✅ Inserted: ${inserted}`);
  console.log(`⏭️  Skipped (already exists): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log("=".repeat(50));
  
  process.exit(0);
}

fixFailedProfessors().catch(console.error);
