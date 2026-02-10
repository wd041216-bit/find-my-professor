import { getDb } from "../server/db";
import { professors } from "../drizzle/schema";
import { isNull, isNotNull, sql } from "drizzle-orm";

async function analyzeExistingTags() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Failed to connect to database");
    process.exit(1);
  }
  
  console.log("🔍 Analyzing existing tags...\n");
  
  // Count professors with and without tags
  const withTags = await db
    .select({ count: sql<number>`count(*)` })
    .from(professors)
    .where(isNotNull(professors.tags));
  
  const withoutTags = await db
    .select({ count: sql<number>`count(*)` })
    .from(professors)
    .where(isNull(professors.tags));
  
  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(professors);
  
  console.log("=" .repeat(50));
  console.log("📊 Tags Analysis:");
  console.log("=".repeat(50));
  console.log(`✅ Professors with tags: ${withTags[0].count}`);
  console.log(`❌ Professors without tags: ${withoutTags[0].count}`);
  console.log(`📈 Total professors: ${total[0].count}`);
  console.log("=".repeat(50));
  
  // Sample professors without tags
  const sampleWithoutTags = await db
    .select()
    .from(professors)
    .where(isNull(professors.tags))
    .limit(10);
  
  console.log("\n📋 Sample professors without tags:");
  sampleWithoutTags.forEach((prof, idx) => {
    console.log(`${idx + 1}. ${prof.name} - ${prof.majorName}`);
  });
  
  process.exit(0);
}

analyzeExistingTags().catch(console.error);
