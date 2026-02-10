import { getDb } from '../server/db';
import { professors, researchFieldImages } from '../drizzle/schema';
import { sql, eq } from 'drizzle-orm';
import { invokeLLM } from '../server/_core/llm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🔍 Classifying CS professors by research field...\n');
  
  // Get all CS professors
  const csProfessors = await db
    .select()
    .from(professors)
    .where(sql`major_name LIKE '%Computer Science%'`);
  
  console.log(`✅ Found ${csProfessors.length} CS professors`);
  
  // Get existing research fields
  const existingFields = await db.select().from(researchFieldImages);
  const fieldNames = existingFields.map(f => f.fieldName);
  
  console.log(`✅ Existing research fields: ${fieldNames.join(', ')}\n`);
  
  // Collect all unique tags from CS professors
  const allTags = new Set<string>();
  for (const prof of csProfessors) {
    if (prof.tags) {
      try {
        const tags = JSON.parse(prof.tags as string);
        tags.forEach((tag: string) => allTags.add(tag));
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
  
  console.log(`✅ Found ${allTags.size} unique tags from CS professors`);
  console.log(`📋 Sample tags: ${Array.from(allTags).slice(0, 20).join(', ')}...\n`);
  
  // Ask LLM to analyze tags and suggest research fields
  console.log('🤖 Asking LLM to analyze tags and map to research fields...\n');
  
  const prompt = `You are analyzing research tags from Computer Science professors at the University of Washington.

**Existing Research Fields:**
${fieldNames.map((f, i) => `${i + 1}. ${f}`).join('\n')}

**All Tags from CS Professors (${allTags.size} unique tags):**
${Array.from(allTags).join(', ')}

**Task:**
1. Analyze these tags and determine if they fit into the existing research fields
2. Suggest NEW research fields if needed (e.g., "Computer Vision", "Robotics", "Systems & Architecture", "Quantum Computing", etc.)
3. For each NEW field, provide a brief description

**Output Format (JSON):**
{
  "analysis": "Brief analysis of tag coverage",
  "existing_fields_coverage": {
    "AI & Machine Learning": ["machine learning", "deep learning", "..."],
    "Human-Computer Interaction": ["hci", "user experience", "..."],
    ...
  },
  "new_fields_needed": [
    {
      "name": "Computer Vision",
      "description": "Research in image processing, 3D reconstruction, and visual recognition",
      "tags": ["computer vision", "image processing", "3d reconstruction", "..."]
    },
    ...
  ]
}`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are a research field classification expert. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'research_field_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            analysis: { type: 'string' },
            existing_fields_coverage: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            new_fields_needed: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['name', 'description', 'tags'],
                additionalProperties: false
              }
            }
          },
          required: ['analysis', 'existing_fields_coverage', 'new_fields_needed'],
          additionalProperties: false
        }
      }
    }
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  console.log('📊 LLM Analysis:\n');
  console.log(result.analysis);
  console.log('\n' + '='.repeat(60));
  
  if (result.new_fields_needed && result.new_fields_needed.length > 0) {
    console.log(`\n🆕 New Research Fields Needed: ${result.new_fields_needed.length}`);
    result.new_fields_needed.forEach((field: any, idx: number) => {
      console.log(`\n${idx + 1}. ${field.name}`);
      console.log(`   Description: ${field.description}`);
      console.log(`   Tags (${field.tags.length}): ${field.tags.slice(0, 5).join(', ')}...`);
    });
  } else {
    console.log('\n✅ No new research fields needed. All tags covered by existing fields.');
  }
  
  // Save result to file for review
  const fs = await import('fs');
  fs.writeFileSync(
    '/home/ubuntu/cs-field-classification.json',
    JSON.stringify(result, null, 2)
  );
  console.log('\n💾 Full analysis saved to /home/ubuntu/cs-field-classification.json');
}

main()
  .then(() => {
    console.log('\n✅ Classification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Classification failed:', error);
    process.exit(1);
  });
