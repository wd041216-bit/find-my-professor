import { getDb } from '../server/db';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  
  console.log('📊 Analyzing Database Structure...\n');
  
  // Get all tables
  const tables = await db.execute(`
    SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME
  `);
  
  const tableList = (tables as any)[0] as Array<{
    TABLE_NAME: string;
    TABLE_ROWS: number;
    DATA_LENGTH: number;
    INDEX_LENGTH: number;
  }>;
  
  console.log(`Found ${tableList.length} tables:\n`);
  
  // Analyze each table
  for (const table of tableList) {
    const tableName = table.TABLE_NAME;
    const rowCount = table.TABLE_ROWS;
    const dataSize = (table.DATA_LENGTH / 1024 / 1024).toFixed(2); // MB
    const indexSize = (table.INDEX_LENGTH / 1024 / 1024).toFixed(2); // MB
    
    console.log(`📋 ${tableName}`);
    console.log(`   Rows: ${rowCount}`);
    console.log(`   Data Size: ${dataSize} MB`);
    console.log(`   Index Size: ${indexSize} MB`);
    
    // Get sample data
    try {
      const sample = await db.execute(`SELECT * FROM ${tableName} LIMIT 1`);
      const sampleData = (sample as any)[0];
      
      if (sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        console.log(`   Columns: ${columns.join(', ')}`);
      }
    } catch (error) {
      console.log(`   Error reading sample: ${(error as Error).message}`);
    }
    
    console.log('');
  }
  
  // Summary
  console.log('\n📊 Summary by Category:\n');
  
  // Professor-related tables
  const profTables = tableList.filter(t => 
    t.TABLE_NAME.includes('professor') || 
    t.TABLE_NAME.includes('scraped_projects')
  );
  console.log('👨‍🏫 Professor-related tables:');
  profTables.forEach(t => {
    console.log(`   - ${t.TABLE_NAME}: ${t.TABLE_ROWS} rows`);
  });
  
  // Research-related tables
  const researchTables = tableList.filter(t => 
    t.TABLE_NAME.includes('research') || 
    t.TABLE_NAME.includes('field') ||
    t.TABLE_NAME.includes('tags')
  );
  console.log('\n🔬 Research-related tables:');
  researchTables.forEach(t => {
    console.log(`   - ${t.TABLE_NAME}: ${t.TABLE_ROWS} rows`);
  });
  
  // User-related tables
  const userTables = tableList.filter(t => 
    t.TABLE_NAME.includes('user') || 
    t.TABLE_NAME.includes('student')
  );
  console.log('\n👤 User-related tables:');
  userTables.forEach(t => {
    console.log(`   - ${t.TABLE_NAME}: ${t.TABLE_ROWS} rows`);
  });
  
  // Cache tables
  const cacheTables = tableList.filter(t => 
    t.TABLE_NAME.includes('cache')
  );
  console.log('\n💾 Cache tables:');
  cacheTables.forEach(t => {
    console.log(`   - ${t.TABLE_NAME}: ${t.TABLE_ROWS} rows`);
  });
  
  // Other tables
  const otherTables = tableList.filter(t => 
    !profTables.includes(t) && 
    !researchTables.includes(t) && 
    !userTables.includes(t) && 
    !cacheTables.includes(t)
  );
  console.log('\n📦 Other tables:');
  otherTables.forEach(t => {
    console.log(`   - ${t.TABLE_NAME}: ${t.TABLE_ROWS} rows`);
  });
  
  console.log('\n✅ Analysis complete!');
}

main().catch(console.error);
