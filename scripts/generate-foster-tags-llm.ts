import { getDb } from '../server/db';
import { scrapedProjects } from '../drizzle/schema';
import { invokeLLM } from '../server/_core/llm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🚀 Starting Foster School tags generation via LLM...\n');
  
  // Get all Foster School professors using raw query
  const fosterProfs = await db.execute(`
    SELECT id, professor_name, major_name 
    FROM scraped_projects 
    WHERE major_name = 'Michael G. Foster School of Business'
    ORDER BY id
  `);
  
  const professors = (fosterProfs as any)[0] || [];
  console.log(`📊 Found ${professors.length} Foster School professors`);
  
  if (professors.length === 0) {
    console.log('No professors found');
    process.exit(0);
  }
  
  // Process in batches
  const batchSize = 20;
  const tagsMap: Record<string, string[]> = {};
  
  for (let i = 0; i < professors.length; i += batchSize) {
    const batch = professors.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(professors.length / batchSize);
    
    console.log(`\n📝 Processing batch ${batchNum}/${totalBatches} (${batch.length} professors)...`);
    
    // Create a prompt with all professors in this batch
    const profList = batch
      .map((p: any) => `- ${p.professor_name}`)
      .join('\n');
    
    const prompt = `Analyze these ${batch.length} business school professors and generate 3-5 relevant research tags for each. 
Focus on business disciplines, research areas, and expertise domains.

Professors:
${profList}

Return a JSON object where keys are professor names and values are arrays of tags.
Example format:
{
  "John Smith": ["Finance", "Corporate Governance", "Risk Management"],
  "Jane Doe": ["Marketing", "Consumer Behavior", "Digital Marketing"]
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are an expert in business education and research areas. Generate accurate, relevant research tags for professors.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });
      
      const content = response.choices[0]?.message?.content || '';
      
      // Parse JSON response
      let parsedTags: Record<string, string[]> = {};
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedTags = JSON.parse(jsonMatch[0]);
        } else {
          parsedTags = JSON.parse(content);
        }
      } catch (parseError) {
        console.error('   ❌ Failed to parse LLM response:', parseError);
        console.log('   Response:', content.substring(0, 200));
        continue;
      }
      
      // Store tags
      for (const [name, tags] of Object.entries(parsedTags)) {
        tagsMap[name] = tags as string[];
      }
      
      console.log(`   ✅ Generated tags for ${Object.keys(parsedTags).length} professors`);
      
    } catch (error) {
      console.error(`   ❌ Error processing batch:`, (error as Error).message);
    }
  }
  
  console.log(`\n💾 Saving tags to database...`);
  
  // Update database with tags using raw SQL
  let updated = 0;
  let failed = 0;
  
  for (const prof of professors) {
    const tags = tagsMap[prof.professor_name] || [];
    
    if (tags.length > 0) {
      try {
        // Use raw SQL to update - escape JSON properly
        const tagsJson = JSON.stringify(tags).replace(/'/g, "\\'");
        const updateSql = `UPDATE scraped_projects SET tags = '${tagsJson}' WHERE id = ${prof.id}`;
        
        await db.execute(updateSql);
        updated++;
      } catch (error) {
        console.error(`   Error updating ${prof.professor_name}:`, (error as Error).message);
        failed++;
      }
    }
  }
  
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  // Verify results
  console.log(`\n✅ Verification...`);
  try {
    const withTags = await db.execute(`
      SELECT COUNT(*) as count FROM scraped_projects 
      WHERE major_name = 'Michael G. Foster School of Business' 
      AND tags IS NOT NULL AND tags != '[]'
    `);
    
    const withoutTags = await db.execute(`
      SELECT COUNT(*) as count FROM scraped_projects 
      WHERE major_name = 'Michael G. Foster School of Business' 
      AND (tags = '[]' OR tags IS NULL)
    `);
    
    const withTagsCount = (withTags as any)[0]?.[0]?.count || 0;
    const withoutTagsCount = (withoutTags as any)[0]?.[0]?.count || 0;
    
    console.log(`   Professors with tags: ${withTagsCount}`);
    console.log(`   Professors without tags: ${withoutTagsCount}`);
  } catch (verifyError) {
    console.error('   Error during verification:', (verifyError as Error).message);
  }
  
  console.log('\n✅ Foster School tags generation complete!');
}

main().catch(console.error);
