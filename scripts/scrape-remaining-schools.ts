import * as cheerio from 'cheerio';
import { getDb } from '../server/db';
import { scrapedProjects } from '../drizzle/schema';

interface ProfessorData {
  professorName: string;
  position: string;
  email: string;
  department: string;
  sourceUrl: string;
}

async function scrapeDepartment(deptName: string, deptUrl: string): Promise<ProfessorData[]> {
  const professors: ProfessorData[] = [];
  
  try {
    console.log(`🔍 Scraping ${deptName}...`);
    
    // Try multiple possible URL patterns
    const urlPatterns = [
      `${deptUrl}/people`,
      `${deptUrl}/faculty`,
      `${deptUrl}/directory`,
      deptUrl
    ];
    
    let response: Response | null = null;
    let peopleUrl = '';
    
    for (const url of urlPatterns) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (res.ok) {
          response = res;
          peopleUrl = url;
          break;
        }
      } catch (e) {
        // Try next URL
      }
    }
    
    if (!response) {
      console.log(`   ⚠️  Could not find faculty page for ${deptName}`);
      return professors;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract from table rows
    const rows = $('table tbody tr, .people-list tr, [class*="directory"] tr, [class*="faculty"] tr');
    
    if (rows.length > 0) {
      console.log(`   Found ${rows.length} rows`);
      
      rows.each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 1) {
          const nameCell = $(cells[0]).text().trim();
          const titleCell = cells.length > 1 ? $(cells[1]).text().trim() : '';
          const emailCell = cells.length > 2 ? $(cells[2]).text().trim() : '';
          
          // Extract email if it's a link
          const emailLink = $row.find('a[href^="mailto:"]').attr('href');
          const email = emailLink ? emailLink.replace('mailto:', '') : emailCell;
          
          // Check if this looks like a faculty member
          const isFaculty = titleCell.includes('Professor') || 
                           titleCell.includes('Instructor') || 
                           titleCell.includes('Lecturer') ||
                           titleCell.includes('Faculty') ||
                           titleCell.includes('Associate') ||
                           titleCell.includes('Assistant') ||
                           titleCell.includes('Director');
          
          if (nameCell && isFaculty && nameCell.length > 2) {
            professors.push({
              professorName: nameCell,
              position: titleCell || 'Faculty',
              email: email,
              department: deptName,
              sourceUrl: peopleUrl
            });
          }
        }
      });
    }
    
    console.log(`   ✅ Found ${professors.length} faculty members`);
    
  } catch (error) {
    console.error(`   ❌ Error:`, (error as Error).message);
  }
  
  return professors;
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  
  const schools = [
    { name: 'College of Built Environments', url: 'https://be.washington.edu' },
    { name: 'Michael G. Foster School of Business', url: 'https://foster.washington.edu' },
    { name: 'School of Dentistry', url: 'https://dental.washington.edu' },
    { name: 'College of Education', url: 'https://education.washington.edu' },
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
  
  console.log('🚀 Starting batch scrape of remaining UW schools...\n');
  
  let totalProfessors = 0;
  const allProfessors: ProfessorData[] = [];
  
  for (const school of schools) {
    try {
      const professors = await scrapeDepartment(school.name, school.url);
      allProfessors.push(...professors);
      totalProfessors += professors.length;
    } catch (error) {
      console.error(`Failed to process ${school.name}:`, error);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Total professors found: ${totalProfessors}`);
  
  // Save to database
  if (allProfessors.length > 0) {
    console.log(`\n💾 Saving to database...`);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const prof of allProfessors) {
      try {
        // Check if already exists
        const existing = await db
          .select()
          .from(scrapedProjects)
          .where(
            (t) => 
              t.professorName === prof.professorName && 
              t.majorName === prof.department
          );
        
        if (existing.length === 0) {
          await db.insert(scrapedProjects).values({
            professorName: prof.professorName,
            position: prof.position,
            email: prof.email,
            majorName: prof.department,
            sourceUrl: prof.sourceUrl,
            tags: JSON.stringify([]),
            researchArea: '',
            researchInterests: ''
          });
          inserted++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error saving ${prof.professorName}:`, error);
      }
    }
    
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipped}`);
  }
  
  console.log('\n✅ Batch scrape complete!');
}

main().catch(console.error);
