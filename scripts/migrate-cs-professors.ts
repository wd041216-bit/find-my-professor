import { getDb } from '../server/db';
import { scrapedProjects, professors, schools, universities } from '../drizzle/schema';
import { sql, eq, and } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  console.log('📊 Migrating CS professors from scraped_projects to professors table...\n');
  
  // 1. Get all CS professors from scraped_projects
  const scrapedCS = await db
    .select()
    .from(scrapedProjects)
    .where(sql`major_name LIKE '%Computer Science%'`);
  
  console.log(`✅ Found ${scrapedCS.length} CS professors in scraped_projects`);
  
  // 2. Group by professor name and merge tags
  const professorMap = new Map<string, typeof scrapedCS[0] & { allTags: string[] }>();
  
  for (const record of scrapedCS) {
    if (!record.professorName) continue;
    
    const existing = professorMap.get(record.professorName);
    let tags: string[] = [];
    if (record.tags) {
      try {
        // Try to parse as JSON first
        tags = JSON.parse(record.tags as string);
      } catch (e) {
        // If not JSON, check if it's a string and split by comma
        if (typeof record.tags === 'string') {
          tags = record.tags.split(',').map(t => t.trim());
        } else {
          console.warn(`Warning: Cannot parse tags for ${record.professorName}:`, record.tags);
          tags = [];
        }
      }
    }
    
    if (existing) {
      // Merge tags
      existing.allTags = [...new Set([...existing.allTags, ...tags])];
    } else {
      professorMap.set(record.professorName, {
        ...record,
        allTags: tags
      });
    }
  }
  
  console.log(`✅ Unique professors: ${professorMap.size}`);
  
  // 3. Find or create university
  let university = await db
    .select()
    .from(universities)
    .where(eq(universities.name, 'University of Washington'))
    .limit(1);
  
  if (university.length === 0) {
    await db.insert(universities).values({
      name: 'University of Washington',
      country: 'United States',
      createdAt: new Date()
    });
    
    university = await db
      .select()
      .from(universities)
      .where(eq(universities.name, 'University of Washington'))
      .limit(1);
    
    console.log('✅ Created university: University of Washington');
  }
  
  const universityId = university[0].id;
  
  // 4. Find or create school
  let school = await db
    .select()
    .from(schools)
    .where(
      and(
        eq(schools.universityId, universityId),
        eq(schools.name, 'Paul G. Allen School of Computer Science & Engineering')
      )
    )
    .limit(1);
  
  if (school.length === 0) {
    await db.insert(schools).values({
      universityId,
      name: 'Paul G. Allen School of Computer Science & Engineering',
      createdAt: new Date()
    });
    
    school = await db
      .select()
      .from(schools)
      .where(
        and(
          eq(schools.universityId, universityId),
          eq(schools.name, 'Paul G. Allen School of Computer Science & Engineering')
        )
      )
      .limit(1);
    
    console.log('✅ Created school: Paul G. Allen School of Computer Science & Engineering');
  }
  
  const schoolId = school[0].id;
  
  // 5. Insert professors
  let insertedCount = 0;
  let skippedCount = 0;
  
  for (const [name, data] of professorMap.entries()) {
    try {
      // Check if already exists
      const existing = await db
        .select()
        .from(professors)
        .where(
          and(
            eq(professors.name, name),
            eq(professors.universityName, 'University of Washington'),
            sql`major_name LIKE '%Computer Science%'`
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`⏭️  Skipped (already exists): ${name}`);
        skippedCount++;
        continue;
      }
      
      // Parse research interests
      let researchInterests: string[] = [];
      try {
        researchInterests = data.researchInterests 
          ? JSON.parse(data.researchInterests as string) 
          : [];
      } catch (e) {
        // If not valid JSON, use as single string
        researchInterests = data.researchInterests ? [data.researchInterests as string] : [];
      }
      
      await db.insert(professors).values({
        name,
        universityName: 'University of Washington',
        majorName: 'Paul G. Allen School of Computer Science & Engineering',
        schoolId,
        department: 'Computer Science & Engineering',
        position: data.position || 'Professor',
        email: data.contactEmail || null,
        researchInterests: JSON.stringify(researchInterests),
        tags: JSON.stringify(data.allTags),
        sourceUrl: data.sourceUrl || null,
        photoUrl: 'https://via.placeholder.com/400x400?text=' + encodeURIComponent(name),
        acceptingStudents: data.acceptingStudents ?? true,
        createdAt: new Date()
      });
      
      console.log(`✅ Inserted: ${name} (${data.allTags.length} tags)`);
      insertedCount++;
    } catch (error) {
      console.error(`❌ Error inserting ${name}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   Total unique professors: ${professorMap.size}`);
  console.log(`   Inserted: ${insertedCount}`);
  console.log(`   Skipped (already exists): ${skippedCount}`);
  console.log('='.repeat(60));
  
  // 6. Verify final count
  const finalCount = await db
    .select()
    .from(professors);
  
  console.log(`\n✅ Total professors in database: ${finalCount.length}`);
}

main()
  .then(() => {
    console.log('\n✅ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
