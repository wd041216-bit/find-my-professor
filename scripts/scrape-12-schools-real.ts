import { getDb } from '../server/db';
import { scrapedProjects } from '../drizzle/schema';

// 12个学院的faculty页面URLs
const schools = [
  {
    name: 'College of Built Environments',
    departments: [
      { name: 'Architecture', url: 'https://arch.be.uw.edu/people/' },
      { name: 'Construction Management', url: 'https://cm.be.uw.edu/people/' },
      { name: 'Landscape Architecture', url: 'https://la.be.uw.edu/people/' },
      { name: 'Real Estate', url: 'https://realestate.be.uw.edu/people/' },
      { name: 'Urban Design & Planning', url: 'https://urbdp.be.uw.edu/people/' }
    ]
  },
  {
    name: 'Michael G. Foster School of Business',
    departments: [
      { name: 'Foster Business School', url: 'https://foster.uw.edu/faculty-research/directory/' }
    ]
  },
  {
    name: 'School of Dentistry',
    departments: [
      { name: 'Dentistry', url: 'https://dental.washington.edu/people/faculty/' }
    ]
  },
  {
    name: 'College of Engineering',
    departments: [
      { name: 'Electrical & Computer Engineering', url: 'https://www.ece.uw.edu/people/faculty/' },
      { name: 'Mechanical Engineering', url: 'https://www.me.washington.edu/people/faculty' },
      { name: 'Chemical Engineering', url: 'https://www.cheme.washington.edu/people' },
      { name: 'Civil & Environmental Engineering', url: 'https://www.ce.washington.edu/people/faculty' },
      { name: 'Aeronautics & Astronautics', url: 'https://www.aa.washington.edu/people/faculty' },
      { name: 'Materials Science & Engineering', url: 'https://www.mse.washington.edu/people/faculty' },
      { name: 'Industrial & Systems Engineering', url: 'https://ise.washington.edu/people/faculty/' },
      { name: 'Bioengineering', url: 'https://bioe.uw.edu/people/faculty/' },
      { name: 'Human Centered Design & Engineering', url: 'https://www.hcde.washington.edu/people' }
    ]
  },
  {
    name: 'College of the Environment',
    departments: [
      { name: 'Aquatic & Fishery Sciences', url: 'https://fish.uw.edu/faculty-staff/faculty/' },
      { name: 'Atmospheric Sciences', url: 'https://atmos.uw.edu/people/faculty/' },
      { name: 'Earth & Space Sciences', url: 'https://www.ess.washington.edu/people/faculty/' },
      { name: 'Environmental & Occupational Health Sciences', url: 'https://deohs.washington.edu/faculty-staff' },
      { name: 'Oceanography', url: 'https://www.ocean.washington.edu/people/faculty' }
    ]
  },
  {
    name: 'Henry M. Jackson School of International Studies',
    departments: [
      { name: 'International Studies', url: 'https://jsis.washington.edu/people/faculty/' }
    ]
  },
  {
    name: 'School of Law',
    departments: [
      { name: 'Law', url: 'https://www.law.uw.edu/directory/faculty' }
    ]
  },
  {
    name: 'School of Medicine',
    departments: [
      { name: 'Medicine', url: 'https://www.uwmedicine.org/school-of-medicine/md-program/faculty' }
    ]
  },
  {
    name: 'School of Nursing',
    departments: [
      { name: 'Nursing', url: 'https://nursing.uw.edu/about-us/directory/?role=faculty' }
    ]
  },
  {
    name: 'School of Pharmacy',
    departments: [
      { name: 'Pharmacy', url: 'https://sop.washington.edu/directory/?role=faculty' }
    ]
  },
  {
    name: 'Daniel J. Evans School of Public Policy & Governance',
    departments: [
      { name: 'Public Policy', url: 'https://evans.uw.edu/people/faculty' }
    ]
  },
  {
    name: 'School of Public Health',
    departments: [
      { name: 'Public Health', url: 'https://sph.washington.edu/faculty' }
    ]
  },
  {
    name: 'School of Social Work',
    departments: [
      { name: 'Social Work', url: 'https://socialwork.uw.edu/faculty' }
    ]
  }
];

async function scrapePage(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // 简单的HTML解析，提取看起来像教授名字的文本
    const namePattern = /([A-Z][a-z]+(?:[-\s][A-Z][a-z]+)+(?:,\s*(?:Ph\.?D\.?|M\.?D\.?|Professor|Associate Professor|Assistant Professor))?)/g;
    const matches = html.match(namePattern) || [];
    
    // 去重并清理
    const uniqueNames = [...new Set(matches)]
      .map(name => name.replace(/,.*$/, '').trim())
      .filter(name => name.length > 5 && name.length < 50);
    
    return uniqueNames;
  } catch (error) {
    console.error(`Error scraping ${url}:`, (error as Error).message);
    return [];
  }
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🚀 Starting real scrape of 12 UW schools...\n');
  
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  for (const school of schools) {
    console.log(`\n📚 Processing: ${school.name}`);
    
    for (const dept of school.departments) {
      console.log(`  📖 Department: ${dept.name}`);
      console.log(`     URL: ${dept.url}`);
      
      const professors = await scrapePage(dept.url);
      console.log(`     Found ${professors.length} professors`);
      
      if (professors.length === 0) {
        console.log(`     ⚠️  No professors found, skipping...`);
        continue;
      }
      
      let inserted = 0;
      let skipped = 0;
      
      for (const profName of professors) {
        try {
          // Check if exists
          const escapedName = profName.replace(/'/g, "\\'");
          const escapedSchool = school.name.replace(/'/g, "\\'");
          
          const existing = await db.execute(`
            SELECT id FROM scraped_projects 
            WHERE professor_name = '${escapedName}' AND major_name = '${escapedSchool}'
          `);
          
          const existsCount = (existing as any)[0]?.length || 0;
          
          if (existsCount === 0) {
            await db.insert(scrapedProjects).values({
              universityName: 'University of Washington',
              majorName: school.name,
              degreeLevel: 'all',
              professorName: profName,
              labName: '',
              researchArea: dept.name,
              projectTitle: `${profName} - ${dept.name}`,
              projectDescription: '',
              requirements: '',
              contactEmail: '',
              sourceUrl: dept.url,
              tags: JSON.stringify([]),
              source: 'scraped',
              searchScope: 'major_specific'
            });
            inserted++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`     Error saving ${profName}:`, (error as Error).message);
          totalFailed++;
        }
      }
      
      console.log(`     ✅ Inserted: ${inserted}, Skipped: ${skipped}`);
      totalInserted += inserted;
      totalSkipped += skipped;
      
      // 等待一下，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\n\n📊 Final Summary:`);
  console.log(`   Total Inserted: ${totalInserted}`);
  console.log(`   Total Skipped: ${totalSkipped}`);
  console.log(`   Total Failed: ${totalFailed}`);
  
  // Verify total count
  const result = await db.execute(`SELECT COUNT(*) as count FROM scraped_projects`);
  const totalCount = (result as any)[0]?.[0]?.count || 0;
  
  console.log(`   Total professors in database: ${totalCount}`);
  console.log('\n✅ Real scrape complete!');
}

main().catch(console.error);
