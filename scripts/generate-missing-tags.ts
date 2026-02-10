import { getDb } from "../server/db";
import { professors } from "../drizzle/schema";
import { isNull, sql } from "drizzle-orm";
import { invokeLLM } from "../server/_core/llm";

async function generateMissingTags() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Failed to connect to database");
    process.exit(1);
  }
  
  console.log("🚀 Generating tags for professors without tags...\n");
  
  // Get professors without tags
  const profsWithoutTags = await db
    .select()
    .from(professors)
    .where(isNull(professors.tags));
  
  console.log(`📊 Found ${profsWithoutTags.length} professors without tags\n`);
  
  let updated = 0;
  let errors = 0;
  
  // Process in batches of 10
  for (let i = 0; i < profsWithoutTags.length; i += 10) {
    const batch = profsWithoutTags.slice(i, i + 10);
    
    console.log(`🔄 Processing batch ${Math.floor(i / 10) + 1}/${Math.ceil(profsWithoutTags.length / 10)}...`);
    
    try {
      // Generate tags for batch using LLM
      const prompt = `You are a research field classifier. For each professor below, generate 3-5 relevant research tags based on their name, department, and title.

Professors:
${batch.map((p, idx) => `${idx + 1}. ${p.name} - ${p.title} at ${p.majorName}`).join('\n')}

Return ONLY a JSON array with this exact structure:
[
  {"name": "Professor Name", "tags": ["tag1", "tag2", "tag3"]},
  ...
]

Rules:
- Tags should be specific research areas or methodologies
- Use standard academic terminology
- Keep tags concise (1-3 words each)
- Return ONLY the JSON array, no other text`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a research field classifier. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        console.error(`❌ Empty response from LLM`);
        errors += batch.length;
        continue;
      }
      
      // Parse LLM response (remove markdown code blocks if present)
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      const tagsData = JSON.parse(jsonContent);
      
      // Update database
      for (const item of tagsData) {
        const prof = batch.find(p => p.name === item.name);
        if (!prof) {
          console.warn(`⚠️  Professor not found: ${item.name}`);
          continue;
        }
        
        await db.execute(sql`
          UPDATE professors 
          SET tags = ${JSON.stringify(item.tags)}
          WHERE id = ${prof.id}
        `);
        
        updated++;
      }
      
      console.log(`✅ Updated ${tagsData.length} professors in this batch`);
      
    } catch (error: any) {
      console.error(`❌ Error processing batch:`, error.message);
      errors += batch.length;
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("📊 Generation Summary:");
  console.log("=".repeat(50));
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log("=".repeat(50));
  
  process.exit(0);
}

generateMissingTags().catch(console.error);
