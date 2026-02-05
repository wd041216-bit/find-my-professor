import mysql from 'mysql2/promise';

/**
 * Populate URL cache from project_matches table
 * Extracts LLM-generated URLs and stores them in professor_url_cache for reuse
 */

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('[URL Cache] Starting to populate URL cache from project_matches...');
    
    // Step 1: Extract unique professor URLs from project_matches
    const [rows] = await connection.execute(`
      SELECT 
        professor_name,
        university,
        url,
        COUNT(*) as usage_count
      FROM project_matches
      WHERE url IS NOT NULL AND url != ''
      GROUP BY professor_name, university, url
      ORDER BY usage_count DESC
    `);
    
    console.log(`[URL Cache] Found ${rows.length} unique professor URLs`);
    
    // Step 2: Insert into professor_url_cache
    let inserted = 0;
    let skipped = 0;
    
    for (const row of rows) {
      try {
        await connection.execute(`
          INSERT INTO professor_url_cache 
          (professor_name, university, department, url, expires_at)
          VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR))
          ON DUPLICATE KEY UPDATE
            url = VALUES(url),
            expires_at = DATE_ADD(NOW(), INTERVAL 1 YEAR)
        `, [
          row.professor_name,
          row.university,
          'Unknown', // We don't have department info in project_matches
          row.url
        ]);
        inserted++;
      } catch (error) {
        console.error(`[URL Cache] Error inserting ${row.professor_name} @ ${row.university}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`[URL Cache] ✅ Completed: ${inserted} URLs inserted/updated, ${skipped} skipped`);
    
  } catch (error) {
    console.error('[URL Cache] Error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
