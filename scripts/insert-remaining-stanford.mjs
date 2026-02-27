import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  try {
    console.log('🚀 Starting Stanford professor insertion...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Configured ✅' : 'Missing ❌');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Connect to database
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Database connected');

    // Check current count
    const [beforeRows] = await connection.execute(
      "SELECT COUNT(*) as count FROM professors WHERE university_name = 'Stanford University'"
    );
    const beforeCount = beforeRows[0].count;
    console.log(`📊 Current Stanford professors in database: ${beforeCount}`);

    // Read all remaining batch files (3-11)
    let totalInserted = 0;
    let totalErrors = 0;

    for (let batchNum = 3; batchNum <= 11; batchNum++) {
      const batchFile = `/tmp/stanford_batch_${batchNum}.sql`;
      
      try {
        const sqlContent = readFileSync(batchFile, 'utf-8');
        
        // Execute the batch
        await connection.query(sqlContent);
        
        const insertCount = sqlContent.split('INSERT INTO professors').length - 1;
        totalInserted += insertCount;
        
        console.log(`✅ Batch ${batchNum}: ${insertCount} professors inserted`);
      } catch (error) {
        console.error(`❌ Batch ${batchNum} failed:`, error.message);
        totalErrors++;
      }
    }

    // Verify final count
    const [afterRows] = await connection.execute(
      "SELECT COUNT(*) as count FROM professors WHERE university_name = 'Stanford University'"
    );
    const afterCount = afterRows[0].count;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 INSERTION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Before: ${beforeCount} professors`);
    console.log(`After: ${afterCount} professors`);
    console.log(`New professors added: ${afterCount - beforeCount}`);
    console.log(`Batches processed: ${9 - totalErrors}/9`);
    console.log(`Errors: ${totalErrors}`);
    console.log('='.repeat(80));

    await connection.end();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Stanford professor insertion completed!');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
