/**
 * Professor Data Collection Script (By Department)
 * 
 * This script collects TOP 5 professors from each department of top US universities
 * using Perplexity API and stores them in the database.
 * 
 * Structure: University → Department → Top 5 Professors
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

// Major departments/fields
const DEPARTMENTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Economics',
  'Psychology',
  'Political Science',
  'History',
  'English Literature',
  'Philosophy',
  'Sociology',
  'Business Administration',
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
      max_tokens: 4000,
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
 * Collect TOP 5 professors from a specific department at a university
 */
async function collectDepartmentProfessors(university, department) {
  console.log(`\n[Collecting] ${university.name} - ${department}`);

  const query = `
Find the TOP 5 most prominent and well-known professors from the ${department} department at ${university.name}.

For each professor, provide:
1. Full name
2. Research field (use "${department}" as the field name)
3. Research interests and specializations (as an array of 3-5 specific research topics)
4. Personal website or faculty page URL

Return ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "professors": [
    {
      "name": "Full Name",
      "research_field": "${department}",
      "university": "${university.name}",
      "website": "https://...",
      "tags": ["specific research topic 1", "specific research topic 2", "specific research topic 3"]
    }
  ]
}

Important:
- Return EXACTLY 5 professors (the most prominent ones)
- Tags should be specific research topics, not generic terms
- Focus on currently active faculty members
- Include their official faculty page URL if available
`;

  try {
    const result = await callPerplexity(query);
    
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

    console.log(`[Success] Found ${professors.length} professors`);
    
    // Validate professor data
    const validProfessors = professors.filter(prof => {
      if (!prof.name || !prof.research_field) {
        console.log(`[Warning] Skipping invalid professor: ${JSON.stringify(prof)}`);
        return false;
      }
      return true;
    });

    if (validProfessors.length !== 5) {
      console.log(`[Warning] Expected 5 professors, got ${validProfessors.length}`);
    }

    return validProfessors;
  } catch (error) {
    console.error(`[Error] Failed to collect: ${error.message}`);
    return [];
  }
}

/**
 * Insert professors into database
 */
async function insertProfessors(professors) {
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
            tags,
            created_at
          ) VALUES (?, ?, ?, ?, NOW())`,
          [
            prof.name,
            prof.university,
            prof.research_field || prof.department,
            JSON.stringify(tags),
          ]
        );

        console.log(`[Insert] ${prof.name}`);
        inserted++;
      } catch (error) {
        console.error(`[Error] Failed to insert ${prof.name}: ${error.message}`);
        errors++;
      }
    }

    return { inserted, skipped, errors };
  } finally {
    await connection.end();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Professor Data Collection Script (By Department) ===');
  console.log(`Universities: ${TOP_UNIVERSITIES.length}`);
  console.log(`Departments per university: ${DEPARTMENTS.length}`);
  console.log(`Professors per department: 5`);
  console.log(`Expected total: ${TOP_UNIVERSITIES.length * DEPARTMENTS.length * 5} professors\n`);

  const allProfessors = [];
  let totalApiCalls = 0;
  let completedDepartments = 0;
  const totalDepartments = TOP_UNIVERSITIES.length * DEPARTMENTS.length;

  for (const university of TOP_UNIVERSITIES) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`=== ${university.name} ===`);
    console.log('='.repeat(70));

    for (const department of DEPARTMENTS) {
      const professors = await collectDepartmentProfessors(university, department);
      allProfessors.push(...professors);
      totalApiCalls++;
      completedDepartments++;

      console.log(`[Progress] ${completedDepartments}/${totalDepartments} departments completed (${Math.round(completedDepartments/totalDepartments*100)}%)`);
      console.log(`[Total Collected] ${allProfessors.length} professors so far`);

      // Rate limiting: wait 2 seconds between requests
      if (completedDepartments < totalDepartments) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Save to database every 50 professors to avoid data loss
      if (allProfessors.length >= 50 && allProfessors.length % 50 === 0) {
        console.log(`\n[Checkpoint] Saving ${allProfessors.length} professors to database...`);
        const result = await insertProfessors(allProfessors);
        console.log(`[Checkpoint] Inserted: ${result.inserted}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
        allProfessors.length = 0; // Clear array after saving
      }
    }
  }

  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`=== Collection Complete ===`);
  console.log(`Total API Calls: ${totalApiCalls}`);
  console.log(`Total Professors Collected: ${allProfessors.length}`);
  console.log('='.repeat(70));

  // Insert remaining professors
  if (allProfessors.length > 0) {
    console.log('\n=== Inserting remaining professors into database ===');
    const result = await insertProfessors(allProfessors);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('=== Final Summary ===');
    console.log(`Universities Processed: ${TOP_UNIVERSITIES.length}`);
    console.log(`Departments per University: ${DEPARTMENTS.length}`);
    console.log(`Total Departments: ${totalDepartments}`);
    console.log(`Successfully Inserted: ${result.inserted}`);
    console.log(`Skipped (Duplicates): ${result.skipped}`);
    console.log(`Errors: ${result.errors}`);
    console.log('='.repeat(70));
  }

  // Final database count
  const mysql = await import('mysql2/promise');
  const connection = await mysql.createConnection(DATABASE_URL);
  const [rows] = await connection.execute('SELECT COUNT(*) as total FROM professors');
  await connection.end();
  
  console.log(`\n[Database] Total professors in database: ${rows[0].total}`);
}

// Run the script
main().catch(error => {
  console.error('\n[Fatal Error]', error);
  process.exit(1);
});
