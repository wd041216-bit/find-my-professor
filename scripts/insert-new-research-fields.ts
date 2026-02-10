import { getDb } from '../server/db';
import { researchFieldImages } from '../drizzle/schema';

const newFields = [
  {
    fieldName: 'Computational Biology & Health Informatics',
    imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/DZchcIHeotXVsoTt.png'
  },
  {
    fieldName: 'Systems & Architecture',
    imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/LDhYMlgDqPeCuRQE.png'
  },
  {
    fieldName: 'Ubiquitous, Mobile & Sensor Systems',
    imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/AnoRAHQPtMmPeggt.png'
  },
  {
    fieldName: 'Theoretical Computer Science & Algorithms',
    imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/nnlpvxfbgxRbuYUT.png'
  },
  {
    fieldName: 'Quantum Computing',
    imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/CZgwIhQSYaLnUJPB.png'
  },
  {
    fieldName: 'Robotics & Computer Vision',
    imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/CBSYKfGNJevnKKwl.png'
  },
  {
    fieldName: 'Programming Languages & Software Engineering',
    imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/oMxKHJjtAlToYzVz.png'
  },
  {
    fieldName: 'Computer Graphics & Extended Reality',
    imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/cJfUBuKpKkdBbHvb.png'
  },
  {
    fieldName: 'Computing Education',
    imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/PHPNlSYKlWWTQDvG.png'
  },
  {
    fieldName: 'Emerging Technologies & Cross-Cutting Areas',
    imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/zGeXgmwZHplCjjRM.png'
  }
];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('📊 Inserting new research fields...\n');
  
  let insertedCount = 0;
  
  for (const field of newFields) {
    try {
      await db.insert(researchFieldImages).values({
        fieldName: field.fieldName,
        imageUrl: field.imageUrl,
        createdAt: new Date()
      });
      
      console.log(`✅ Inserted: ${field.fieldName}`);
      insertedCount++;
    } catch (error: any) {
      if (error.message && error.message.includes('Duplicate entry')) {
        console.log(`⏭️  Skipped (already exists): ${field.fieldName}`);
      } else {
        console.error(`❌ Error inserting ${field.fieldName}:`, error);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Total new fields: ${newFields.length}`);
  console.log(`   Inserted: ${insertedCount}`);
  console.log('='.repeat(60));
  
  // Verify total count
  const allFields = await db.select().from(researchFieldImages);
  console.log(`\n✅ Total research fields in database: ${allFields.length}`);
}

main()
  .then(() => {
    console.log('\n✅ Insertion complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Insertion failed:', error);
    process.exit(1);
  });
