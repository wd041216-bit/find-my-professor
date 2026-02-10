import { getDb } from '../server/db';
import { scrapedProjects } from '../drizzle/schema';
import { invokeLLM } from '../server/_core/llm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  // Get all professors
  const allProfessors = await db
    .select()
    .from(scrapedProjects)
    .orderBy(scrapedProjects.majorName);

  // Filter to only Arts & Sciences departments
  const professors = allProfessors.filter(p => 
    p.majorName?.includes('Department') || p.majorName?.includes('School')
  );

  console.log(`📚 Found ${professors.length} Arts & Sciences professors to process\n`);

  let processed = 0;
  const batchSize = 50;
  
  for (let i = 0; i < professors.length; i += batchSize) {
    const batch = professors.slice(i, i + batchSize);
    
    console.log(`\n📋 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} professors)...`);
    
    // Create a summary of professors in this batch
    const professorList = batch
      .map(p => `- ${p.professorName} (${p.position}, ${p.majorName})`)
      .join('\n');
    
    const prompt = `Analyze the following ${batch.length} university professors from the College of Arts & Sciences and generate 2-4 relevant research tags for each based on their name, position, and department. Return a JSON object with professor names as keys and arrays of tags as values.

${professorList}

Return ONLY valid JSON in this format:
{
  "Professor Name 1": ["tag1", "tag2", "tag3"],
  "Professor Name 2": ["tag1", "tag2"]
}`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are an expert in academic research fields. Generate relevant research tags for professors based on their position and department. Tags should be specific research areas or methodologies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = response.choices[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('   ⚠️  Could not extract JSON from response');
        continue;
      }

      const tagsMap = JSON.parse(jsonMatch[0]);

      // Update database with tags
      for (const prof of batch) {
        const tags = tagsMap[prof.professorName] || [];
        
        if (tags.length > 0 && prof.id) {
          try {
            const { eq } = await import('drizzle-orm');
            await db
              .update(scrapedProjects)
              .set({ tags: JSON.stringify(tags) })
              .where(eq(scrapedProjects.id, prof.id));
            
            processed++;
            if (processed % 100 === 0) {
              console.log(`   ✅ Processed ${processed} professors...`);
            }
          } catch (updateError) {
            console.error(`   Error updating ${prof.professorName}:`, updateError);
          }
        }
      }

    } catch (error) {
      console.error('   ❌ Error processing batch:', error);
    }

    // Add delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ Completed! Processed ${processed}/${professors.length} professors`);
}

main().catch(console.error);
