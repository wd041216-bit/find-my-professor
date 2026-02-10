import { getDb } from "../server/db";
import { professors } from "../drizzle/schema";
import { sql } from "drizzle-orm";
import { invokeLLM } from "../server/_core/llm";
import * as fs from "fs";

async function analyzeAllTags() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Failed to connect to database");
    process.exit(1);
  }
  
  console.log("🔍 Extracting all unique tags from 2553 professors...\n");
  
  // Get all professors with tags
  const allProfs = await db.select().from(professors);
  
  // Extract all unique tags
  const allTagsSet = new Set<string>();
  allProfs.forEach(prof => {
    if (prof.tags && Array.isArray(prof.tags)) {
      prof.tags.forEach((tag: string) => allTagsSet.add(tag));
    }
  });
  
  const allTags = Array.from(allTagsSet).sort();
  
  console.log(`📊 Found ${allTags.length} unique tags\n`);
  console.log("Sample tags:", allTags.slice(0, 20).join(", "));
  
  // Save all tags to file
  fs.writeFileSync(
    "/home/ubuntu/all-unique-tags.json",
    JSON.stringify(allTags, null, 2)
  );
  
  console.log("\n✅ Saved all tags to /home/ubuntu/all-unique-tags.json");
  
  // Get existing research fields
  const existingFieldsResult = await db.execute(sql`
    SELECT DISTINCT research_field_name FROM research_field_tag_mapping
  `);
  const existingFields = (existingFieldsResult as any)[0] || [];
  
  const fieldNames = existingFields.map((f: any) => f.research_field_name);
  
  console.log(`\n📚 Existing research fields (${fieldNames.length}):`);
  console.log(fieldNames.join(", "));
  
  console.log("\n🤖 Using LLM to analyze tags and create comprehensive tag mapping...\n");
  
  // Use LLM to analyze tags and create mapping
  const prompt = `You are a research field classifier for academic institutions.

I have ${allTags.length} unique research tags from 2553 professors across 15 departments at University of Washington.

Existing research fields (${fieldNames.length}):
${fieldNames.join(", ")}

All unique tags (${allTags.length}):
${allTags.join(", ")}

Your task:
1. Analyze all tags and group them into appropriate research fields
2. Use existing research fields when possible
3. Suggest NEW research fields if needed for uncovered areas
4. Create a comprehensive tag-to-field mapping

Return a JSON object with this structure:
{
  "tag_mapping": {
    "tag_name": "Research Field Name",
    ...
  },
  "new_fields_needed": [
    {
      "name": "New Field Name",
      "description": "Brief description",
      "sample_tags": ["tag1", "tag2", "tag3"]
    }
  ],
  "statistics": {
    "total_tags": number,
    "mapped_to_existing": number,
    "needs_new_fields": number
  }
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a research field classifier. Return only valid JSON." },
      { role: "user", content: prompt }
    ],
  });
  
  const content = response.choices[0].message.content;
  if (!content) {
    console.error("❌ Empty response from LLM");
    process.exit(1);
  }
  
  // Parse LLM response
  let jsonContent = content.trim();
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
  const analysisResult = JSON.parse(jsonContent);
  
  // Save analysis result
  fs.writeFileSync(
    "/home/ubuntu/tag-mapping-analysis.json",
    JSON.stringify(analysisResult, null, 2)
  );
  
  console.log("✅ Saved analysis to /home/ubuntu/tag-mapping-analysis.json\n");
  
  console.log("=" .repeat(50));
  console.log("📊 Analysis Summary:");
  console.log("=".repeat(50));
  console.log(`Total tags: ${analysisResult.statistics.total_tags}`);
  console.log(`Mapped to existing fields: ${analysisResult.statistics.mapped_to_existing}`);
  console.log(`Need new fields: ${analysisResult.statistics.needs_new_fields}`);
  console.log(`\nNew fields needed: ${analysisResult.new_fields_needed.length}`);
  console.log("=".repeat(50));
  
  if (analysisResult.new_fields_needed.length > 0) {
    console.log("\n🆕 Suggested new research fields:");
    analysisResult.new_fields_needed.forEach((field: any, idx: number) => {
      console.log(`${idx + 1}. ${field.name}`);
      console.log(`   Description: ${field.description}`);
      console.log(`   Sample tags: ${field.sample_tags.join(", ")}`);
    });
  }
  
  process.exit(0);
}

analyzeAllTags().catch(console.error);
