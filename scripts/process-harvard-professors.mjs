import fs from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';

// Research field normalization mapping
const FIELD_MAPPINGS = {
  'Computer Science': ['computer science', 'cs', 'computing', 'software', 'ai', 'artificial intelligence', 'machine learning', 'data science'],
  'Engineering': ['engineering', 'mechanical', 'electrical', 'biomedical engineering', 'robotics'],
  'Biology': ['biology', 'biological', 'molecular', 'cellular', 'genetics', 'bioengineering', 'biochemistry'],
  'Physics': ['physics', 'astrophysics', 'quantum'],
  'Mathematics': ['mathematics', 'math', 'applied math', 'statistics'],
  'Chemistry': ['chemistry', 'chemical'],
  'Medicine & Health': ['medicine', 'health', 'medical', 'clinical'],
  'Economics': ['economics', 'economic'],
  'Political Science': ['political', 'government', 'politics'],
  'Sociology & Anthropology': ['sociology', 'anthropology', 'social'],
  'History': ['history', 'historical'],
  'Literature & Languages': ['literature', 'languages', 'linguistics', 'english', 'romance', 'germanic', 'slavic', 'classics'],
  'Philosophy': ['philosophy'],
  'Architecture & Planning': ['architecture', 'planning', 'urban'],
  'Arts & Design': ['art', 'visual', 'film', 'design', 'theater', 'dance', 'media', 'music'],
  'Business & Management': ['business', 'management'],
  'Education': ['education', 'pedagogy'],
  'Environmental Science': ['environmental', 'ecology', 'planetary', 'earth'],
  'Music & Theater': ['music', 'theater', 'theatre', 'dance', 'performance']
};

function normalizeResearchField(rawField) {
  const lower = rawField.toLowerCase();
  
  for (const [standardField, keywords] of Object.entries(FIELD_MAPPINGS)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return standardField;
    }
  }
  
  return 'Other';
}

async function main() {
  console.log('[Process] Starting Harvard professors data processing...');
  
  // Read collected data
  const rawData = JSON.parse(fs.readFileSync('/home/ubuntu/collect_harvard_professors.json', 'utf8'));
  
  // Connect to database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });
  
  let totalProcessed = 0;
  let totalSaved = 0;
  let totalFailed = 0;
  
  for (const result of rawData.results) {
    const major = result.input;
    console.log(`\n[Process] Processing major: ${major}`);
    
    try {
      // Parse professors JSON (handle both array and object formats)
      let professorsData;
      try {
        const parsed = JSON.parse(result.output.professors_json);
        professorsData = Array.isArray(parsed) ? parsed : parsed.professors || [];
      } catch (parseError) {
        console.error(`[Error] Failed to parse JSON for ${major}:`, parseError.message);
        totalFailed++;
        continue;
      }
      
      for (const prof of professorsData) {
        totalProcessed++;
        
        // Validate required fields
        if (!prof.name || !prof.title || !prof.department || !prof.research_field) {
          console.warn(`[Warning] Missing required fields for professor in ${major}:`, prof);
          totalFailed++;
          continue;
        }
        
        // Normalize research field
        const standardField = normalizeResearchField(prof.research_field);
        
        // Prepare data for insertion
        const professorData = {
          name: prof.name.trim(),
          title: prof.title.trim(),
          department: prof.department.trim(),
          universityName: 'Harvard University',
          research_field: standardField,
          tags: prof.tags ? prof.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        try {
          // Insert into database
          await db.insert(schema.professors).values(professorData);
          totalSaved++;
          console.log(`[Success] Saved: ${prof.name} (${standardField})`);
        } catch (dbError) {
          console.error(`[Error] Failed to save ${prof.name}:`, dbError.message);
          totalFailed++;
        }
      }
    } catch (error) {
      console.error(`[Error] Failed to process major ${major}:`, error.message);
      totalFailed++;
    }
  }
  
  await connection.end();
  
  console.log('\n[Summary] Processing complete!');
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Total saved: ${totalSaved}`);
  console.log(`Total failed: ${totalFailed}`);
  console.log(`Success rate: ${((totalSaved / totalProcessed) * 100).toFixed(2)}%`);
}

main().catch(console.error);
