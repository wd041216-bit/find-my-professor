/**
 * Professor Data Collection Script (Optimized)
 * 
 * This script collects professor information from top US universities
 * using Perplexity API and stores them in the database.
 * 
 * Optimization: One API call per university to collect professors from multiple fields.
 */

import 'dotenv/config';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!PERPLEXITY_API_KEY) {
  console.error('Error: PERPLEXITY_API_KEY not found in environment variables');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Top 10 US Universities (US News 2024)
const TOP_UNIVERSITIES = [
  { name: 'Princeton University', shortName: 'Princeton' },
  { name: 'Massachusetts Institute of Technology', shortName: 'MIT' },
  { name: 'Harvard University', shortName: 'Harvard' },
  { name: 'Stanford University', shortName: 'Stanford' },
  { name: 'Yale University', shortName: 'Yale' },
  { name: 'University of Pennsylvania', shortName: 'UPenn' },
  { name: 'California Institute of Technology', shortName: 'Caltech' },
  { name: 'Duke University', shortName: 'Duke' },
  { name: 'Brown University', shortName: 'Brown' },
  { name: 'Johns Hopkins University', shortName: 'Johns Hopkins' },
];

/**
 * Call Perplexity API to search for professor information
 */
async function callPerplexity(query) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts professor information from university websites. Return data in JSON format only, no additional text.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.2,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Collect professors from a specific university (all fields at once)
 */
async function collectUniversityProfessors(university) {
  console.log(`\n[Collecting] ${university.name}`);

  const query = `
Find 50-80 prominent professors from ${university.name} across various departments including:
- Computer Science & Engineering
- Mathematics & Statistics
- Physics
- Chemistry
- Biology & Life Sciences
- Economics
- Psychology
- Political Science
- History
- Other major departments

For each professor, provide:
1. Full name
2. Research field/department (be specific, e.g., "Computer Science", "Applied Mathematics", "Theoretical Physics")
3. Research interests and specializations (as an array of 3-5 specific tags)
4. Email address (if publicly available)
5. Personal website or faculty page URL

Return ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "professors": [
    {
      "name": "Full Name",
      "research_field": "Department Name",
      "university": "${university.name}",
      "email": "email@university.edu",
      "website": "https://...",
      "tags": ["specific tag 1", "specific tag 2", "specific tag 3"]
    }
  ]
}

Important:
- Focus on active, prominent faculty members
- Use specific research field names (not generic)
- Tags should be specific research topics, not generic terms
- Include diverse fields, not just STEM
`;

  try {
    const result = await callPerplexity(query);
    console.log(`[Raw Response Length] ${result.length} characters`);
    console.log(`[First 300 chars] ${result.substring(0, 300)}...`);

    // Clean up the response (remove markdown code blocks if present)
    let cleanResult = result.trim();
    if (cleanResult.startsWith('```json')) {
      cleanResult = cleanResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResult.startsWith('```')) {
      cleanResult = cleanResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to parse JSON
    const data = JSON.parse(cleanResult);
    const professors = data.professors || [];

    console.log(`[Success] Found ${professors.length} professors from ${university.name}`);
    
    // Validate and clean professor data
    const validProfessors = professors.filter(prof => {
      if (!prof.name || !prof.research_field) {
        console.log(`[Warning] Skipping invalid professor: ${JSON.stringify(prof)}`);
        return false;
      }
      return true;
    });

    console.log(`[Valid] ${validProfessors.length} professors after validation`);
    return validProfessors;
  } catch (error) {
    console.error(`[Error] Failed to collect professors from ${university.name}: ${error.message}`);
    console.error(`[Error Details]`, error);
    return [];
  }
}

/**
 * Insert professors into database
 */
async function insertProfessors(professors) {
  // Import mysql2 dynamically
  const mysql = await import('mysql2/promise');

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const prof of professors) {
      try {
        // Check if professor already exists
        const [existing] = await connection.execute(
          'SELECT id FROM professors WHERE name = ? AND university_name = ?',
          [prof.name, prof.university]
        );

        if (existing.length > 0) {
          console.log(`[Skip] ${prof.name} already exists`);
          skipped++;
          continue;
        }

        // Prepare tags
        let tags = prof.tags || [];
        if (typeof tags === 'string') {
          tags = [tags];
        }

        // Insert professor
        await connection.execute(
          `INSERT INTO professors (
            name, 
            university_name, 
            research_field, 
            website, 
            tags,
            created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            prof.name,
            prof.university,
            prof.research_field || prof.department,
            prof.website || null,
            JSON.stringify(tags),
          ]
        );

        console.log(`[Insert] ${prof.name} - ${prof.research_field} - ${prof.university}`);
        inserted++;
      } catch (error) {
        console.error(`[Error] Failed to insert ${prof.name}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n[Database Summary] Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
    return { inserted, skipped, errors };
  } finally {
    await connection.end();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Professor Data Collection Script (Optimized) ===');
  console.log(`Collecting from ${TOP_UNIVERSITIES.length} universities`);
  console.log(`Strategy: One API call per university\n`);

  const allProfessors = [];
  let totalApiCalls = 0;

  for (const university of TOP_UNIVERSITIES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`=== ${university.name} ===`);
    console.log('='.repeat(60));

    const professors = await collectUniversityProfessors(university);
    allProfessors.push(...professors);
    totalApiCalls++;

    console.log(`[Progress] ${totalApiCalls}/${TOP_UNIVERSITIES.length} universities completed`);
    console.log(`[Total Collected] ${allProfessors.length} professors so far`);

    // Rate limiting: wait 3 seconds between universities
    if (totalApiCalls < TOP_UNIVERSITIES.length) {
      console.log('[Rate Limit] Waiting 3 seconds before next university...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`=== Collection Complete ===`);
  console.log(`Total API Calls: ${totalApiCalls}`);
  console.log(`Total Professors Collected: ${allProfessors.length}`);
  console.log('='.repeat(60));

  // Insert into database
  if (allProfessors.length > 0) {
    console.log('\n=== Inserting into database ===');
    const result = await insertProfessors(allProfessors);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('=== Final Summary ===');
    console.log(`Universities Processed: ${TOP_UNIVERSITIES.length}`);
    console.log(`Professors Collected: ${allProfessors.length}`);
    console.log(`Successfully Inserted: ${result.inserted}`);
    console.log(`Skipped (Duplicates): ${result.skipped}`);
    console.log(`Errors: ${result.errors}`);
    console.log('='.repeat(60));
  } else {
    console.log('\n[Warning] No professors collected');
  }
}

// Run the script
main().catch(error => {
  console.error('\n[Fatal Error]', error);
  process.exit(1);
});
