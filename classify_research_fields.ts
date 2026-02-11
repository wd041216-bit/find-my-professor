/**
 * Script to classify professors into research fields using LLM
 * Analyzes research_areas and tags to assign appropriate research_field
 */

import fs from 'fs';
import mysql from 'mysql2/promise';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface Professor {
  id: number;
  name: string;
  department: string;
  research_areas: string;
  tags: string;
}

// Predefined research field categories
const RESEARCH_FIELDS = [
  "Artificial Intelligence & Machine Learning",
  "Computer Systems & Networks",
  "Data Science & Analytics",
  "Biomedical Engineering & Health Tech",
  "Environmental Science & Sustainability",
  "Quantum Physics & Materials Science",
  "Molecular Biology & Genetics",
  "Social Sciences & Policy",
  "Business & Economics",
  "Education & Learning Sciences",
  "Medicine & Clinical Research",
  "Law & Justice",
  "Architecture & Urban Planning",
  "Chemistry & Chemical Engineering",
  "Mechanical & Aerospace Engineering",
  "Electrical Engineering & Robotics",
  "Psychology & Cognitive Science",
  "Linguistics & Communication",
  "History & Cultural Studies",
  "Mathematics & Statistics",
  "Physics & Astronomy",
  "Earth Sciences & Oceanography",
  "Public Health & Epidemiology",
  "Nursing & Healthcare",
  "Pharmacy & Drug Development",
  "Dentistry & Oral Health",
  "Social Work & Community Services"
];

async function classifyProfessorBatch(professors: Professor[]): Promise<Map<number, string>> {
  const prompt = `You are a research field classification expert. Given a list of professors with their research areas and tags, classify each professor into ONE of the following research fields:

${RESEARCH_FIELDS.map((field, idx) => `${idx + 1}. ${field}`).join('\n')}

Professors to classify:
${professors.map((prof, idx) => `
Professor ${idx + 1} (ID: ${prof.id}):
- Name: ${prof.name}
- Department: ${prof.department}
- Research Areas: ${prof.research_areas}
- Tags: ${prof.tags}
`).join('\n')}

Return ONLY a JSON object mapping professor IDs to research field names. Use the exact field names from the list above.
Format: {"professor_id": "Research Field Name", ...}

Example: {"123": "Artificial Intelligence & Machine Learning", "456": "Biomedical Engineering & Health Tech"}`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a research field classification expert. Always return valid JSON mapping professor IDs to research field names.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }
    
    const classifications = JSON.parse(jsonContent);
    
    // Convert to Map<number, string>
    const result = new Map<number, string>();
    for (const [idStr, field] of Object.entries(classifications)) {
      result.set(parseInt(idStr), field as string);
    }
    
    return result;
  } catch (error) {
    console.error('Error classifying professors:', error);
    return new Map();
  }
}

async function main() {
  if (!PERPLEXITY_API_KEY) {
    console.error('Error: PERPLEXITY_API_KEY environment variable is not set');
    process.exit(1);
  }

  // Connect to database
  const promisePool = mysql.createPool(process.env.DATABASE_URL!);

  try {
    // Fetch all professors without research_field
    const [rows] = await promisePool.execute(
      'SELECT id, name, department, research_areas, tags FROM professors WHERE research_field IS NULL OR research_field = ""'
    );

    const professors = rows as Professor[];
    console.log(`Found ${professors.length} professors to classify`);

    if (professors.length === 0) {
      console.log('No professors to classify. Exiting.');
      return;
    }

    // Process in batches of 10 to optimize API calls
    const BATCH_SIZE = 10;
    let classified = 0;
    let errors = 0;

    for (let i = 0; i < professors.length; i += BATCH_SIZE) {
      const batch = professors.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} professors)...`);

      const classifications = await classifyProfessorBatch(batch);

      // Update database
      for (const [profId, field] of classifications.entries()) {
        try {
          await promisePool.execute(
            'UPDATE professors SET research_field = ? WHERE id = ?',
            [field, profId]
          );
          const prof = batch.find(p => p.id === profId);
          console.log(`  ✓ ${prof?.name}: ${field}`);
          classified++;
        } catch (error: any) {
          console.error(`  ✗ Error updating professor ${profId}:`, error.message);
          errors++;
        }
      }

      // Rate limiting: wait 2 seconds between batches
      if (i + BATCH_SIZE < professors.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total professors: ${professors.length}`);
    console.log(`Classified: ${classified}`);
    console.log(`Errors: ${errors}`);

    // Get unique research fields
    const [fieldRows] = await promisePool.execute(
      'SELECT DISTINCT research_field FROM professors WHERE research_field IS NOT NULL ORDER BY research_field'
    );
    
    const uniqueFields = (fieldRows as any[]).map(row => row.research_field);
    console.log(`\nUnique research fields found: ${uniqueFields.length}`);
    uniqueFields.forEach(field => console.log(`  - ${field}`));

    // Save to file for image generation
    fs.writeFileSync('/home/ubuntu/research_fields.json', JSON.stringify(uniqueFields, null, 2));
    console.log('\nResearch fields saved to /home/ubuntu/research_fields.json');

  } finally {
    await promisePool.end();
  }
}

main().catch(console.error);
