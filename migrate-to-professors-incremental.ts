import { getDb } from "./server/db";
import { professors, scrapedProjects, schools } from "./drizzle/schema";
import { eq, sql } from "drizzle-orm";

async function migrateData() {
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    return;
  }
  console.log("================================================================================");
  console.log("📦 Incremental Migration: scraped_projects → professors");
  console.log("================================================================================");


  // Step 1: Fetch all records from scraped_projects
  console.log("Step 1: Fetching all records from scraped_projects...");
  const scrapedData = await db.select().from(scrapedProjects);
  console.log(`  Found ${scrapedData.length} records`);

  // Step 2: Group by professor name and merge tags
  console.log("Step 2: Grouping by professor name and merging tags...");
  const professorMap = new Map<string, {
    name: string;
    title: string | null;
    email: string | null;
    universityName: string;
    majorName: string;
    tags: string[];
  }>();

  for (const record of scrapedData) {
    const key = record.professor_name;
    
    // Parse tags with error handling
    let parsedTags: string[] = [];
    if (record.tags) {
      try {
        parsedTags = JSON.parse(record.tags);
      } catch (error) {
        console.warn(`  ⚠️  Failed to parse tags for ${record.professor_name}: ${record.tags}`);
        parsedTags = [];
      }
    }
    
    if (!professorMap.has(key)) {
      professorMap.set(key, {
        name: record.professor_name,
        title: record.title,
        email: record.email,
        universityName: record.university_name,
        majorName: record.major_name,
        tags: parsedTags,
      });
    } else {
      // Merge tags
      const existing = professorMap.get(key)!;
      existing.tags = [...new Set([...existing.tags, ...parsedTags])];
    }
  }

  console.log(`  Grouped into ${professorMap.size} unique professors`);

  // Step 3: Get existing professors
  console.log("Step 3: Fetching existing professors...");
  const existingProfessors = await db.select().from(professors);
  const existingNames = new Set(existingProfessors.map(p => p.name));
  console.log(`  Found ${existingProfessors.length} existing professors`);

  // Step 4: Get school IDs
  console.log("Step 4: Fetching school IDs...");
  const schoolsData = await db.select().from(schools);
  const schoolMap = new Map<string, number>();
  for (const school of schoolsData) {
    schoolMap.set(school.name, school.id);
  }

  // Step 5: Insert new professors only
  console.log("Step 5: Inserting new professors...");
  let insertedCount = 0;
  let skippedCount = 0;

  for (const [_, prof] of professorMap) {
    if (existingNames.has(prof.name)) {
      skippedCount++;
      continue;
    }

    const schoolId = schoolMap.get(prof.majorName) || 1; // Default to 1 if not found

    await db.insert(professors).values({
      name: prof.name,
      title: prof.title,
      email: prof.email,
      universityName: prof.universityName,
      majorName: prof.majorName,
      schoolId: schoolId,
      tags: JSON.stringify(prof.tags),
    });

    insertedCount++;
  }

  console.log(`  Inserted ${insertedCount} new professors`);
  console.log(`  Skipped ${skippedCount} existing professors`);

  console.log("================================================================================");
  console.log("✅ Incremental Migration Completed!");
  console.log("================================================================================");
}

migrateData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
