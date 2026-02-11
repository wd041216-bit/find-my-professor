/**
 * Script to reclassify professors into research fields using dynamic dictionary
 * Priority: match existing 33 standard fields first, create new fields only if necessary
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

// Load standard fields from database
const STANDARD_FIELDS = JSON.parse(fs.readFileSync('/home/ubuntu/standard_fields.json', 'utf-8'));

async function classifyProfessorBatch(professors: Professor[]): Promise<Map<number, string>> {
  const prompt = `You are a research field classification expert. Given a list of professors with their research areas and tags, classify each professor into ONE research field.

**IMPORTANT**: Prioritize matching professors to these ${STANDARD_FIELDS.length} existing standard fields:

${STANDARD_FIELDS.map((field: string, idx: number) => `${idx + 1}. ${field}`).join('\n')}

**Rules**:
1. FIRST, try to match the professor to one of the standard fields above
2. ONLY create a new field name if NONE of the standard fields accurately describe the professor's research
3. New field names should follow the pattern: "[Primary Area] & [Secondary Area]" (e.g., "Neuroscience & Brain-Computer Interfaces")
4. Be conservative - prefer existing fields over creating new ones

Professors to classify:
${professors.map((prof, idx) => `
Professor ${idx + 1} (ID: ${prof.id}):
- Name: ${prof.name}
- Department: ${prof.department}
- Research Areas: ${prof.research_areas}
- Tags: ${prof.tags}
`).join('\n')}

Return ONLY a JSON object mapping professor IDs to research field names.
Format: {"professor_id": "Research Field Name", ...}

Example: {"123": "AI & Machine Learning", "456": "Biomedical Engineering & Neuroscience"}`;

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
            content: 'You are a research field classification expert. Always return valid JSON mapping professor IDs to research field names. Prioritize matching to existing standard fields.',
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

  console.log(`Loaded ${STANDARD_FIELDS.length} standard research fields from database`);

  // Connect to database
  const promisePool = mysql.createPool(process.env.DATABASE_URL!);

  try {
    // Fetch ALL professors (we want to reclassify everyone for consistency)
    const [rows] = await promisePool.execute(
      'SELECT id, name, department, research_areas, tags FROM professors ORDER BY id'
    );

    const professors = rows as Professor[];
    console.log(`Found ${professors.length} professors to reclassify`);

    if (professors.length === 0) {
      console.log('No professors to classify. Exiting.');
      return;
    }

    // Process in batches of 10 to optimize API calls
    const BATCH_SIZE = 10;
    let classified = 0;
    let errors = 0;
    const newFields = new Set<string>();

    for (let i = 0; i < professors.length; i += BATCH_SIZE) {
      const batch = professors.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(professors.length / BATCH_SIZE)} (${batch.length} professors)...`);

      const classifications = await classifyProfessorBatch(batch);

      // Update database
      for (const [profId, field] of classifications.entries()) {
        try {
          await promisePool.execute(
            'UPDATE professors SET research_field = ? WHERE id = ?',
            [field, profId]
          );
          const prof = batch.find(p => p.id === profId);
          
          // Track new fields
          if (!STANDARD_FIELDS.includes(field)) {
            newFields.add(field);
            console.log(`  ✓ ${prof?.name}: ${field} [NEW FIELD]`);
          } else {
            console.log(`  ✓ ${prof?.name}: ${field}`);
          }
          
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
    console.log(`New fields created: ${newFields.size}`);

    if (newFields.size > 0) {
      console.log(`\nNew research fields:`);
      Array.from(newFields).forEach(field => console.log(`  - ${field}`));
      
      // Save new fields to file for image generation
      fs.writeFileSync('/home/ubuntu/new_fields.json', JSON.stringify(Array.from(newFields), null, 2));
      console.log('\nNew fields saved to /home/ubuntu/new_fields.json');
    }

    // Get final unique research fields
    const [fieldRows] = await promisePool.execute(
      'SELECT DISTINCT research_field FROM professors WHERE research_field IS NOT NULL ORDER BY research_field'
    );
    
    const uniqueFields = (fieldRows as any[]).map(row => row.research_field);
    console.log(`\nTotal unique research fields: ${uniqueFields.length}`);

  } finally {
    await promisePool.end();
  }
}

main().catch(console.error);
