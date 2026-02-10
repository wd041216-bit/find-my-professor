import { getDb } from './server/db';
import { professors } from './drizzle/schema';
import { invokeLLM } from './server/_core/llm';
import { sql } from 'drizzle-orm';

// Research field categories
const RESEARCH_FIELDS = [
  "AI & Machine Learning",
  "Human-Computer Interaction",
  "Data Science & Analytics",
  "Information Retrieval & NLP",
  "Social Computing & Networks",
  "Privacy & Security",
  "Health Informatics",
  "Education Technology"
];

async function classifyProfessors() {
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    return;
  }

  // Fetch all professors with tags that haven't been classified yet
  const allProfessors = await db.select().from(professors).where(sql`research_field IS NULL`);
  console.log(`Found ${allProfessors.length} unclassified professors`);
  
  if (allProfessors.length === 0) {
    console.log("All professors already classified!");
    process.exit(0);
  }

  for (const professor of allProfessors) {
    if (!professor.tags || professor.tags.length === 0) {
      console.log(`Skipping ${professor.name} (no tags)`);
      continue;
    }

    // Use LLM to classify based on tags
    const prompt = `Based on the following research tags, classify this professor into ONE of these research fields:

Research Fields:
${RESEARCH_FIELDS.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Professor Tags: ${JSON.stringify(professor.tags)}

Respond with ONLY the field name (e.g., "AI & Machine Learning"). Choose the most relevant field.`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a research field classification expert." },
          { role: "user", content: prompt }
        ]
      });

      const fieldName = response.choices[0].message.content?.trim() || "";
      
      // Validate field name
      if (!RESEARCH_FIELDS.includes(fieldName)) {
        console.log(`Invalid field for ${professor.name}: ${fieldName}, defaulting to first match`);
        // Try to find a partial match
        const match = RESEARCH_FIELDS.find(f => fieldName.toLowerCase().includes(f.toLowerCase()));
        if (match) {
          await db.update(professors)
            .set({ researchField: match })
            .where({ id: professor.id });
          console.log(`✓ ${professor.name} → ${match}`);
        } else {
          console.log(`✗ ${professor.name} → Could not classify`);
        }
      } else {
        await db.update(professors)
          .set({ researchField: fieldName })
          .where({ id: professor.id });
        console.log(`✓ ${professor.name} → ${fieldName}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error classifying ${professor.name}:`, error);
    }
  }

  console.log("\nClassification complete!");
  process.exit(0);
}

classifyProfessors().catch(console.error);
