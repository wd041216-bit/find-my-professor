import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  try {
    console.log('🚀 Starting Stanford professor insertion (v2 - single statement mode)...');
    
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
        
        // Split by INSERT statements (each INSERT...VALUES...); is one statement)
        const statements = sqlContent
          .split(/INSERT INTO professors/)
          .filter(s => s.trim().length > 0)
          .map(s => 'INSERT INTO professors' + s.trim());
        
        console.log(`\n📦 Batch ${batchNum}: ${statements.length} statements to execute`);
        
        let batchSuccess = 0;
        let batchErrors = 0;
        
        for (const statement of statements) {
          try {
            await connection.query(statement);
            batchSuccess++;
          } catch (error) {
            console.error(`  ❌ Statement failed: ${error.message.substring(0, 100)}`);
            batchErrors++;
          }
        }
        
        totalInserted += batchSuccess;
        totalErrors += batchErrors;
        
        console.log(`✅ Batch ${batchNum}: ${batchSuccess}/${statements.length} professors inserted`);
        
      } catch (error) {
        console.error(`❌ Batch ${batchNum} file read failed:`, error.message);
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
    console.log(`Total statements executed: ${totalInserted}`);
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
