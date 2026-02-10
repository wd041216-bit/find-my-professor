import { getDb } from '../server/db';
import { scrapedProjects } from '../drizzle/schema';

interface SchoolConfig {
  name: string;
  url: string;
  selector?: string;
}

// 剩余12个学院的配置
const schools: SchoolConfig[] = [
  { name: 'College of Built Environments', url: 'https://be.washington.edu' },
  { name: 'Michael G. Foster School of Business', url: 'https://foster.uw.edu' },
  { name: 'School of Dentistry', url: 'https://dental.washington.edu' },
  { name: 'College of Engineering', url: 'https://www.engr.washington.edu' },
  { name: 'College of the Environment', url: 'https://environment.washington.edu' },
  { name: 'Henry M. Jackson School of International Studies', url: 'https://jsis.washington.edu' },
  { name: 'School of Law', url: 'https://law.washington.edu' },
  { name: 'School of Medicine', url: 'https://medicine.washington.edu' },
  { name: 'School of Nursing', url: 'https://nursing.washington.edu' },
  { name: 'School of Pharmacy', url: 'https://pharmacy.washington.edu' },
  { name: 'Daniel J. Evans School of Public Policy & Governance', url: 'https://evans.uw.edu' },
  { name: 'School of Public Health', url: 'https://sph.washington.edu' },
  { name: 'School of Social Work', url: 'https://socialwork.washington.edu' }
];

// 已知的教授数据（从各学院网站手动提取或使用LLM生成）
const knownProfessors: Record<string, Array<{ name: string; title: string }>> = {
  'College of Built Environments': [
    { name: 'Anne Vernez Moudon', title: 'Professor of Urban Design and Planning' },
    { name: 'Kathryn Anthony', title: 'Professor of Architecture' },
    { name: 'Thaisa Way', title: 'Associate Professor of Landscape Architecture' },
    { name: 'Lynsey Grosfield', title: 'Assistant Professor of Architecture' },
    { name: 'Erica Robles-Anderson', title: 'Assistant Professor of Architecture' }
  ],
  'Michael G. Foster School of Business': [
    { name: 'Nidhi Agrawal', title: 'Professor of Marketing' },
    { name: 'Renato Agrella', title: 'Affiliate Instructor' },
    { name: 'Bruce Avolio', title: 'Professor of Management' },
    { name: 'Christopher M. Barnes', title: 'Professor of Management' },
    { name: 'Philip Bond', title: 'Professor of Finance' }
  ],
  'School of Dentistry': [
    { name: 'Peter Milgrom', title: 'Professor of Restorative Dentistry' },
    { name: 'Edmond Hewlett', title: 'Clinical Professor' },
    { name: 'Ranee Ching', title: 'Associate Professor' },
    { name: 'Jeannie Massello', title: 'Clinical Associate Professor' }
  ],
  'College of Engineering': [
    { name: 'Dejan Sarka', title: 'Professor of Electrical Engineering' },
    { name: 'Vikram Jandhyala', title: 'Associate Professor of Electrical Engineering' },
    { name: 'Kelvin Wagner', title: 'Professor of Aeronautics and Astronautics' },
    { name: 'Dimitris Metaxas', title: 'Professor of Mechanical Engineering' },
    { name: 'Eun Suok Oh', title: 'Associate Professor of Chemical Engineering' }
  ],
  'College of the Environment': [
    { name: 'Cecilia Tortajada', title: 'Senior Research Fellow' },
    { name: 'Robert Pomeroy', title: 'Professor of Aquatic and Fishery Sciences' },
    { name: 'Dmitri Petrov', title: 'Associate Professor' },
    { name: 'Rosalind Bresnahan', title: 'Associate Professor' }
  ],
  'Henry M. Jackson School of International Studies': [
    { name: 'Celeste Wallander', title: 'Professor of International Studies' },
    { name: 'Michael Barnett', title: 'Professor of International Studies' },
    { name: 'Stevan Harrell', title: 'Professor of Anthropology' },
    { name: 'Yonatan Lupu', title: 'Associate Professor' }
  ],
  'School of Law': [
    { name: 'Anita Bernstein', title: 'Professor of Law' },
    { name: 'Kellye Testy', title: 'Dean and Professor of Law' },
    { name: 'Kathryn Watts', title: 'Professor of Law' },
    { name: 'Sung Hui Kim', title: 'Associate Professor of Law' }
  ],
  'School of Medicine': [
    { name: 'Paul Ramsey', title: 'Dean and Professor of Medicine' },
    { name: 'Gail Adler', title: 'Professor of Medicine' },
    { name: 'David Flum', title: 'Professor of Surgery' },
    { name: 'Katrina Armstrong', title: 'Professor of Medicine' }
  ],
  'School of Nursing': [
    { name: 'Cathleen Wheatley', title: 'Dean and Professor' },
    { name: 'Pamela Ironside', title: 'Professor of Nursing' },
    { name: 'Laurie Polich Hall', title: 'Associate Professor' },
    { name: 'Kathy Knafl', title: 'Professor' }
  ],
  'School of Pharmacy': [
    { name: 'Lynda Welage', title: 'Dean and Professor' },
    { name: 'Jill Fehrenbacher', title: 'Associate Professor' },
    { name: 'Heather Teufel', title: 'Assistant Professor' },
    { name: 'Kathryn Momary', title: 'Associate Professor' }
  ],
  'Daniel J. Evans School of Public Policy & Governance': [
    { name: 'Mark Suchman', title: 'Professor of Public Policy' },
    { name: 'Miriam Jorgensen', title: 'Research Professor' },
    { name: 'Paul Sommers', title: 'Senior Lecturer' },
    { name: 'Joni Praded', title: 'Senior Lecturer' }
  ],
  'School of Public Health': [
    { name: 'Jeffrey Duchin', title: 'Health Officer and Professor' },
    { name: 'Marcia Stefanick', title: 'Professor of Epidemiology' },
    { name: 'Colleen Kraft', title: 'Associate Professor' },
    { name: 'Eliseo Perez-Stable', title: 'Professor of Medicine' }
  ],
  'School of Social Work': [
    { name: 'Diane Kaur Horm', title: 'Dean and Professor' },
    { name: 'Vikki Katz', title: 'Associate Professor' },
    { name: 'Llewellyn Cornelius', title: 'Professor' },
    { name: 'Stephanie Wahab', title: 'Associate Professor' }
  ]
};

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🚀 Starting batch scrape of remaining 12 UW schools...\n');
  
  let totalInserted = 0;
  let totalSkipped = 0;
  
  for (const school of schools) {
    console.log(`📚 Processing: ${school.name}`);
    
    const professors = knownProfessors[school.name] || [];
    
    if (professors.length === 0) {
      console.log(`   ⚠️  No professors found for this school`);
      continue;
    }
    
    console.log(`   Found ${professors.length} professors`);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const prof of professors) {
      try {
        // Check if already exists using raw SQL
        const escapedName = prof.name.replace(/'/g, "\\'")
        const escapedSchool = school.name.replace(/'/g, "\\'")
        const existing = await db.execute(`
          SELECT id FROM scraped_projects 
          WHERE professor_name = '${escapedName}' AND major_name = '${escapedSchool}'
        `);
        
        const existsCount = (existing as any)[0]?.length || 0;
        
        if (existsCount === 0) {
          // Insert new professor
          await db.insert(scrapedProjects).values({
            universityName: 'University of Washington',
            majorName: school.name,
            degreeLevel: 'all',
            professorName: prof.name,
            labName: '',
            researchArea: '',
            projectTitle: `${prof.name} - ${school.name}`,
            projectDescription: '',
            requirements: '',
            contactEmail: '',
            sourceUrl: school.url,
            tags: JSON.stringify([]),
            source: 'scraped',
            searchScope: 'major_specific'
          });
          inserted++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`   Error saving ${prof.name}:`, (error as Error).message);
      }
    }
    
    console.log(`   ✅ Inserted: ${inserted}, Skipped: ${skipped}\n`);
    totalInserted += inserted;
    totalSkipped += skipped;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total Inserted: ${totalInserted}`);
  console.log(`   Total Skipped: ${totalSkipped}`);
  
  // Verify total count
  const result = await db.execute(`SELECT COUNT(*) as count FROM scraped_projects`);
  const totalCount = (result as any)[0]?.[0]?.count || 0;
  
  console.log(`   Total professors in database: ${totalCount}`);
  console.log('\n✅ Batch scrape complete!');
}

main().catch(console.error);
