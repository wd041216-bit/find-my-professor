import { getDb } from "../server/db";
import * as fs from "fs";
import * as path from "path";

async function importCompleteTagMapping() {
  console.log("Reading tag mapping analysis...");
  
  const analysisPath = path.join("/home/ubuntu", "tag-mapping-analysis.json");
  const analysisData = JSON.parse(fs.readFileSync(analysisPath, "utf-8"));
  
  const tagMapping = analysisData.tag_mapping;
  const totalTags = Object.keys(tagMapping).length;
  
  console.log(`Found ${totalTags} tags to import`);
  
  const db = await getDb();
  
  // Get existing tags to avoid duplicates
  const existingTags: any = await db.execute(
    "SELECT tag FROM research_field_tag_mapping"
  );
  const existingTagSet = new Set(
    existingTags.map((row: any) => row.tag)
  );
  
  console.log(`Existing tags in database: ${existingTagSet.size}`);
  
  // Prepare new tags to insert
  const newTags: Array<{ tag: string; research_field_name: string }> = [];
  
  for (const [tag, fieldName] of Object.entries(tagMapping)) {
    if (!existingTagSet.has(tag)) {
      newTags.push({
        tag,
        research_field_name: fieldName as string,
      });
    }
  }
  
  console.log(`New tags to insert: ${newTags.length}`);
  
  if (newTags.length === 0) {
    console.log("✅ All tags already exist in database!");
    return;
  }
  
  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < newTags.length; i += batchSize) {
    const batch = newTags.slice(i, i + batchSize);
    const values = batch
      .map(
        (item) =>
          `('${item.research_field_name.replace(/'/g, "''")}', '${item.tag.replace(/'/g, "''")}')`
      )
      .join(",");
    
    const query = `INSERT IGNORE INTO research_field_tag_mapping (research_field_name, tag) VALUES ${values}`;
    
    await db.execute(query);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${newTags.length} tags...`);
  }
  
  console.log(`\n✅ Successfully imported ${inserted} new tags!`);
  console.log(`Total tags in database: ${existingTagSet.size + inserted}`);
  console.log(`Coverage: ${existingTagSet.size + inserted}/${totalTags} (${((existingTagSet.size + inserted) / totalTags * 100).toFixed(1)}%)`);
}

importCompleteTagMapping()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error importing tag mapping:", error);
    process.exit(1);
  });
