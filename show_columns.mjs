import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function showColumns() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('\n=== project_matches table columns ===');
    const [columns] = await connection.query('SHOW COLUMNS FROM project_matches');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

showColumns();
