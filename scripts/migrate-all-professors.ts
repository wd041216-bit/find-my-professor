import { getDb } from "../server/db";
import { scrapedProjects, professors } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

async function migrateAllProfessors() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Failed to connect to database");
    process.exit(1);
  }
  
  console.log("🚀 Starting professor data migration...\n");
  
  // Step 1: Get all scraped professors
  console.log("📊 Fetching all professors from scraped_projects...");
  const scrapedProfs = await db.select().from(scrapedProjects);
  console.log(`Found ${scrapedProfs.length} professors in scraped_projects\n`);
  
  // Step 2: Get existing professors to avoid duplicates
  console.log("📊 Fetching existing professors...");
  const existingProfs = await db.select().from(professors);
  console.log(`Found ${existingProfs.length} existing professors\n`);
  
  // Create a set of existing professor names for quick lookup
  const existingNames = new Set(
    existingProfs.map(p => `${p.name}|${p.universityName}|${p.majorName}`.toLowerCase())
  );
  
  // Step 3: Migrate professors in batches
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  
  console.log("🔄 Migrating professors...\n");
  
  for (const scraped of scrapedProfs) {
    const key = `${scraped.professorName}|${scraped.universityName}|${scraped.majorName}`.toLowerCase();
    
    // Skip if already exists
    if (existingNames.has(key)) {
      skipped++;
      continue;
    }
    
    try {
      // Insert new professor
      await db.insert(professors).values({
        universityName: scraped.universityName,
        majorName: scraped.majorName,
        name: scraped.professorName || "Unknown",
        department: scraped.majorName,
        title: "Professor", // Default title
        researchAreas: scraped.researchArea ? [scraped.researchArea] : [],
        tags: scraped.tags || [],
        labName: scraped.labName,
        sourceUrl: scraped.sourceUrl,
        bio: scraped.projectDescription,
        acceptingStudents: true,
      });
      
      inserted++;
      
      if (inserted % 100 === 0) {
        console.log(`✅ Migrated ${inserted} professors...`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Error migrating ${scraped.professorName}:`, error);
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("📊 Migration Summary:");
  console.log("=".repeat(50));
  console.log(`✅ Inserted: ${inserted}`);
  console.log(`⏭️  Skipped (already exists): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📈 Total professors in database: ${existingProfs.length + inserted}`);
  console.log("=".repeat(50));
  
  process.exit(0);
}

migrateAllProfessors().catch(console.error);
