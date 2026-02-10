import { getDb } from '../server/db';
import { researchFieldImages } from '../drizzle/schema';
import { invokeLLM } from '../server/_core/llm';
import fs from 'fs';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🤖 Building complete tag mapping for all 18 research fields...\n');
  
  // Load the tags analysis
  const tagsAnalysis = JSON.parse(
    fs.readFileSync('/home/ubuntu/all-professor-tags-analysis.json', 'utf-8')
  );
  
  // Get all research fields
  const allFields = await db.select().from(researchFieldImages);
  console.log(`✅ Found ${allFields.length} research fields\n`);
  
  // Prepare the prompt for LLM
  const prompt = `You are a research field classification expert. I have 18 research fields and 77 unique tags from 120 professors at University of Washington (Information School + Computer Science).

**Your task:** Create a comprehensive tag-to-field mapping that assigns each tag to the MOST appropriate research field.

**Research Fields (18 total):**
${allFields.map((f, i) => `${i + 1}. ${f.fieldName}`).join('\n')}

**All Tags (77 unique tags, with frequency):**
${Object.entries(tagsAnalysis.tag_frequency).map(([tag, count]) => `- ${tag} (${count} professors)`).join('\n')}

**Requirements:**
1. Each tag should be mapped to exactly ONE research field (the most appropriate one)
2. Handle case-insensitive matching (e.g., "Machine Learning" and "machine learning" are the same)
3. Consider semantic similarity (e.g., "AI" and "Artificial Intelligence" should map to the same field)
4. Be comprehensive - map ALL 77 tags
5. Prioritize accuracy over coverage - if a tag clearly belongs to a field, map it there

**Output format (JSON):**
{
  "field_name_1": ["tag1", "tag2", "tag3", ...],
  "field_name_2": ["tag4", "tag5", ...],
  ...
}

**Important notes:**
- Use the EXACT field names from the list above
- Normalize all tags to lowercase in your output
- Include ALL variations of a tag (e.g., both "Machine Learning" and "machine learning")
- Some fields may have many tags, others may have few - that's okay

Generate the complete mapping now:`;

  console.log('📤 Sending request to LLM...\n');
  
  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are a research field classification expert. Always respond with valid JSON only, no additional text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]
  });
  
  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in LLM response');
  }
  
  console.log('\n📝 Raw LLM response (first 500 chars):', content.substring(0, 500));
  
  // Try to extract JSON from the response
  let mapping: Record<string, string[]>;
  
  try {
    const result = JSON.parse(content);
    // Handle both {"mapping": {...}} and direct {...} formats
    mapping = result.mapping || result;
  } catch (error) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/```\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[1]);
      mapping = result.mapping || result;
    } else {
      throw new Error('Failed to parse JSON from LLM response');
    }
  }
  
  console.log('✅ Received mapping from LLM\n');
  
  // Validate and display the mapping
  console.log('='.repeat(60));
  console.log('📋 Tag Mapping by Research Field:');
  console.log('='.repeat(60));
  
  let totalMappedTags = 0;
  
  for (const field of allFields) {
    const tags = mapping[field.fieldName] || [];
    totalMappedTags += tags.length;
    console.log(`\n${field.fieldName} (${tags.length} tags):`);
    console.log(`  ${tags.join(', ')}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Total tags in analysis: ${tagsAnalysis.total_unique_tags}`);
  console.log(`   Total tags mapped: ${totalMappedTags}`);
  console.log('='.repeat(60));
  
  // Save the mapping
  const outputData = {
    generated_at: new Date().toISOString(),
    total_fields: allFields.length,
    total_tags_mapped: totalMappedTags,
    mapping: mapping
  };
  
  fs.writeFileSync(
    '/home/ubuntu/complete-tag-mapping.json',
    JSON.stringify(outputData, null, 2)
  );
  
  console.log('\n✅ Mapping saved to /home/ubuntu/complete-tag-mapping.json');
}

main()
  .then(() => {
    console.log('\n✅ Mapping generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Mapping generation failed:', error);
    process.exit(1);
  });
