import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function checkMatches() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Check project_matches for Washington + Physics
    console.log('\n=== Checking project_matches for Washington + Physics ===');
    const [matches] = await connection.query(`
      SELECT id, projectName, university, major, created_at 
      FROM project_matches 
      WHERE (university LIKE '%Washington%' OR university LIKE '%华盛顿%')
        AND (major LIKE '%Physics%' OR major LIKE '%物理%')
      ORDER BY created_at DESC 
      LIMIT 15
    `);
    console.log(`Found ${matches.length} matches:`);
    matches.forEach(m => {
      console.log(`  - ID: ${m.id}, Project: ${m.projectName}, University: ${m.university}, Major: ${m.major}, Created: ${m.created_at}`);
    });
    
    // Check scraped_projects for Washington + Physics
    console.log('\n=== Checking scraped_projects for Washington + Physics ===');
    const [scraped] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM scraped_projects 
      WHERE (university LIKE '%Washington%' OR university LIKE '%华盛顿%')
        AND (major LIKE '%Physics%' OR major LIKE '%物理%')
    `);
    console.log(`Found ${scraped[0].count} scraped projects`);
    
    // Check most recent matches (any university)
    console.log('\n=== Most recent matches (any university) ===');
    const [recent] = await connection.query(`
      SELECT id, projectName, university, major, created_at 
      FROM project_matches 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    recent.forEach(m => {
      console.log(`  - ${m.university} / ${m.major}: ${m.projectName} (${m.created_at})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkMatches();
