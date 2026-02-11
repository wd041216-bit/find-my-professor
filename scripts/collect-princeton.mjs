import mysql from 'mysql2/promise';
import 'dotenv/config';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Princeton University所有103个专业
const DEPARTMENTS = [
  "African American Studies", "African Studies", "American Studies", "Anthropology",
  "Applied and Computational Mathematics", "Architecture", "Art and Archaeology",
  "Asian American Studies", "Astrophysical Sciences", "Atmospheric and Oceanic Sciences",
  "Bioengineering", "Biophysics", "Chemical and Biological Engineering", "Chemistry",
  "Civil and Environmental Engineering", "Classics", "Climate Science", "Cognitive Science",
  "Comparative Literature", "Computational Science and Engineering", "Computer Science",
  "Creative Writing", "Dance", "East Asian Studies", "Ecology and Evolutionary Biology",
  "Economics", "Electrical and Computer Engineering", "Engineering Physics", "English",
  "Entrepreneurship", "Environmental Studies", "European Studies", "Finance",
  "French and Italian", "Gender and Sexuality Studies", "Geosciences", "German",
  "Global Health and Health Policy", "Hellenic Studies", "History",
  "History and the Practice of Diplomacy", "History of Art", "History of Science",
  "History of Science, Technology and Medicine", "Humanistic Studies",
  "Interdisciplinary Humanities", "Journalism", "Judaic Studies", "Latin American Studies",
  "Latino Studies", "Linguistics", "Materials Science", "Materials Science and Engineering",
  "Mathematics", "Mechanical and Aerospace Engineering", "Medieval Studies",
  "Molecular Biology", "Music", "Music Composition", "Music Performance", "Musicology",
  "Near Eastern Studies", "Neuroscience", "Operations Research and Financial Engineering",
  "Optimization and Quantitative Decision Science", "Philosophy", "Physics",
  "Planets and Life", "Plasma Physics", "Politics", "Population Studies", "Psychology",
  "Public Policy", "Quantitative and Computational Biology", "Quantitative Economics",
  "Quantum Science and Engineering", "Religion", "Robotics",
  "Russian, East European and Eurasian Studies", "Slavic Languages and Literatures",
  "Social Policy", "Sociology", "South Asian Studies", "Spanish and Portuguese",
  "Statistics and Machine Learning", "Sustainable Energy", "Teacher Preparation",
  "Technology and Society", "Theater and Music Theater",
  "Translation and Intercultural Communication", "Urban Studies", "Values and Public Life",
  "Visual Arts"
];

async function callPerplexityAPI(prompt) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
          content: 'You are a research assistant. Return ONLY valid JSON without any markdown formatting or code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function collectProfessorsForDepartment(department) {
  const prompt = `Find the top 3 most renowned professors in ${department} at Princeton University.

For each professor, provide:
1. Full name
2. Primary research field/specialization
3. 3-5 research tags (keywords describing their research areas)

Return ONLY a JSON array like this (no markdown, no code blocks):
[
  {
    "name": "Professor Full Name",
    "research_field": "Primary Field",
    "tags": ["tag1", "tag2", "tag3"]
  }
]

If you cannot find professors for this department, return an empty array: []`;

  try {
    const responseText = await callPerplexityAPI(prompt);
    
    // Remove markdown code blocks if present
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }
    
    const professors = JSON.parse(cleanedText);
    
    // Add university and department info
    return professors.map(prof => ({
      ...prof,
      university: 'Princeton University',
      department: department
    }));
  } catch (error) {
    console.error(`[Error] Failed to collect ${department}:`, error.message);
    return [];
  }
}

async function saveProfessorsToDatabase(professors, connection) {
  let inserted = 0;
  let skipped = 0;

  for (const prof of professors) {
    try {
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
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`[Skip] ${prof.name} (duplicate)`);
        skipped++;
      } else {
        console.error(`[Error] Failed to insert ${prof.name}:`, error.message);
      }
    }
  }

  return { inserted, skipped };
}

async function main() {
  console.log('='.repeat(70));
  console.log('Princeton University Professor Data Collection');
  console.log('='.repeat(70));
  console.log(`Total departments: ${DEPARTMENTS.length}`);
  console.log(`Expected professors: ${DEPARTMENTS.length * 3} (3 per department)`);
  console.log('');

  // Connect to database
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log('[Database] Connected');
  console.log('');

  // Delete existing Princeton professors
  const [deleteResult] = await connection.execute(
    `DELETE FROM professors WHERE university_name = 'Princeton University'`
  );
  console.log(`[Database] Deleted ${deleteResult.affectedRows} existing Princeton professors`);
  console.log('');

  let allProfessors = [];
  let totalInserted = 0;
  let totalSkipped = 0;

  for (let i = 0; i < DEPARTMENTS.length; i++) {
    const dept = DEPARTMENTS[i];
    console.log(`[${i + 1}/${DEPARTMENTS.length}] Collecting: ${dept}`);

    try {
      const professors = await collectProfessorsForDepartment(dept);
      
      if (professors.length > 0) {
        console.log(`[Success] Found ${professors.length} professors`);
        allProfessors.push(...professors);

        // Save to database every 30 professors
        if (allProfessors.length >= 30) {
          const stats = await saveProfessorsToDatabase(allProfessors, connection);
          totalInserted += stats.inserted;
          totalSkipped += stats.skipped;
          console.log(`[Batch Save] Inserted: ${stats.inserted}, Skipped: ${stats.skipped}`);
          allProfessors = [];
        }
      } else {
        console.log(`[Warning] No professors found`);
      }

      console.log(`[Progress] ${i + 1}/${DEPARTMENTS.length} departments completed`);
      console.log('');

      // Rate limiting: wait 2 seconds between API calls
      if (i < DEPARTMENTS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`[Error] ${dept}:`, error.message);
      console.log('');
    }
  }

  // Save remaining professors
  if (allProfessors.length > 0) {
    const stats = await saveProfessorsToDatabase(allProfessors, connection);
    totalInserted += stats.inserted;
    totalSkipped += stats.skipped;
    console.log(`[Final Save] Inserted: ${stats.inserted}, Skipped: ${stats.skipped}`);
  }

  await connection.end();

  console.log('');
  console.log('='.repeat(70));
  console.log('Collection Complete!');
  console.log('='.repeat(70));
  console.log(`Total Inserted: ${totalInserted}`);
  console.log(`Total Skipped: ${totalSkipped}`);
  console.log(`Total Professors: ${totalInserted + totalSkipped}`);
}

main().catch(console.error);
