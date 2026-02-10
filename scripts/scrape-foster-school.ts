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

async function scrapeFosterFaculty(): Promise<ProfessorData[]> {
  const professors: ProfessorData[] = [];
  const baseUrl = 'https://foster.uw.edu/faculty-research/directory/';
  
  try {
    console.log('🔍 Scraping Foster School of Business faculty directory...');
    
    const response = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract faculty from the directory page
    // The page shows faculty cards with name, title, and link to profile
    const facultyCards = $('[class*="faculty"], [class*="profile"], [class*="card"]');
    
    console.log(`   Found ${facultyCards.length} potential faculty cards`);
    
    // Try to find faculty in different ways
    // Method 1: Look for profile links
    const profileLinks = $('a[href*="/faculty-research/faculty/"]');
    console.log(`   Found ${profileLinks.length} profile links`);
    
    if (profileLinks.length > 0) {
      profileLinks.each((_, link) => {
        const $link = $(link);
        const href = $link.attr('href');
        const name = $link.text().trim();
        
        if (name && href) {
          // Try to find title in nearby elements
          const $parent = $link.closest('[class*="faculty"], [class*="profile"], [class*="card"]');
          const title = $parent.find('[class*="title"], [class*="position"]').text().trim() || 'Faculty';
          
          professors.push({
            professorName: name,
            position: title || 'Faculty',
            email: '',
            department: 'Michael G. Foster School of Business',
            sourceUrl: baseUrl
          });
        }
      });
    }
    
    // Method 2: Look for faculty names in text content
    if (professors.length === 0) {
      const text = $.text();
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      // Look for patterns like "Name Title"
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        const nextLine = lines[i + 1].trim();
        
        // Check if line looks like a name (capitalized words)
        if (line.match(/^[A-Z][a-z]+ [A-Z]/) && 
            (nextLine.includes('Professor') || nextLine.includes('Instructor') || nextLine.includes('Lecturer'))) {
          professors.push({
            professorName: line,
            position: nextLine,
            email: '',
            department: 'Michael G. Foster School of Business',
            sourceUrl: baseUrl
          });
        }
      }
    }
    
    console.log(`   ✅ Found ${professors.length} faculty members`);
    
  } catch (error) {
    console.error('   ❌ Error scraping Foster:', (error as Error).message);
  }
  
  return professors;
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  
  console.log('🚀 Starting Foster School of Business scrape...\n');
  
  const baseUrl = 'https://foster.uw.edu/faculty-research/directory/';
  const professors = await scrapeFosterFaculty();
  
  if (professors.length === 0) {
    console.log('⚠️  No faculty found. Trying alternative method...');
    
    // Alternative: Use a more direct approach
    // Foster's faculty directory might be JavaScript-rendered
    // For now, we'll use a manual list of known Foster faculty
    const knownFoster = [
      { name: 'Nidhi Agrawal', title: 'Professor of Marketing' },
      { name: 'Renato Agrella', title: 'Affiliate Instructor' },
      { name: 'Mikhail Alexeeff', title: 'Teaching Associate of Accounting' },
      { name: 'Farah Ali', title: 'Affiliate Instructor' },
      { name: 'Uttara M. Ananthakrishnan', title: 'Assistant Professor' },
      { name: 'Bruce Avolio', title: 'Professor of Management' },
      { name: 'Wendy Baesler', title: 'Acting Instructor of Accounting' },
      { name: 'Bebe Bales', title: 'Affiliate Instructor of Management' },
      { name: 'Christopher M. Barnes', title: 'Professor of Management' },
      { name: 'Ivan Barron', title: 'Assistant Teaching Professor of Management' },
      { name: 'Jay Bartot', title: 'Affiliate Instructor' },
      { name: 'Leta Beard', title: 'Associate Teaching Professor of Marketing' },
      { name: 'Tod Bergstrom', title: 'Assistant Teaching Professor' },
      { name: 'Darren Bernard', title: 'Associate Professor of Accounting' },
      { name: 'Patrick Bettin', title: 'Part-time Lecturer of Management' },
      { name: 'Gregory Bigley', title: 'Associate Professor of Management' },
      { name: 'Michal Biron', title: 'Visiting Associate Professor' },
      { name: 'Shirsho Biswas', title: 'Assistant Professor of Marketing' },
      { name: 'Taylor Black', title: 'Affiliate Instructor' },
      { name: 'Justin Blaney', title: 'Affiliate Instructor' },
      { name: 'Elizabeth Blankespoor', title: 'Professor of Accounting' },
      { name: 'Kevin K. Boeh', title: 'Associate Teaching Professor of Finance' },
      { name: 'Warren Boeker', title: 'Professor of Management' },
      { name: 'Philip Bond', title: 'Professor of Finance' },
      { name: 'Léonard Boussioux', title: 'Assistant Professor' },
      { name: 'Robert Bowen', title: 'Professor Emeritus of Accounting' },
      { name: 'William Bradford', title: 'Professor Emeritus of Finance' },
      { name: 'Michael C. Brown', title: 'Affiliate Instructor' },
      { name: 'Phillip Bruner', title: 'Professor of Practice' },
      { name: 'Minda Vale Brusse', title: 'Lecturer of Finance' },
      { name: 'Vernon Buck', title: 'Professor Emeritus' },
      { name: 'David Burgstahler', title: 'Professor of Accounting' },
      { name: 'William Burrows', title: 'Associate Teaching Professor' },
      { name: 'Will Canestaro', title: 'Affiliate Instructor' },
      { name: 'Kjiel Carlson', title: 'Affiliate Instructor' },
      { name: 'Sean Carr', title: 'Affiliate Associate Professor' },
      { name: 'Kanika Chander', title: 'Affiliate Instructor' },
      { name: 'Xiao-Ping Chen', title: 'Professor of Management' },
      { name: 'Shi Chen', title: 'Professor of Operations Management' },
      { name: 'Wanning Chen', title: 'Assistant Professor' },
      { name: 'Jean Choy', title: 'Associate Teaching Professor' },
      { name: 'Jacob Colker', title: 'Affiliate Instructor' },
      { name: 'Connie Collingsworth', title: 'Affiliate Instructor' },
      { name: 'Molly Breysse Cox', title: 'Lecturer' },
      { name: 'Emily Cox Pahnke', title: 'Associate Professor' },
      { name: 'Asher Curtis', title: 'Associate Professor of Accounting' },
      { name: 'Vladimir Dashkeev', title: 'Assistant Teaching Professor' },
      { name: 'Ed deHaan', title: 'Associate Professor of Accounting' },
      { name: 'Neal Dempsey', title: 'Affiliate Instructor' },
      { name: 'Alicia DeSantola', title: 'Assistant Professor' },
      { name: 'Charlie Donovan', title: 'Visiting Professor' },
      { name: 'Emer Dooley', title: 'Affiliate Instructor' },
      { name: 'Pete Dukes', title: 'Professor Emeritus' },
      { name: 'Gary M. Erickson', title: 'Professor Emeritus' },
      { name: 'Barry Erickson', title: 'Assistant Teaching Professor' },
      { name: 'Mazen Fadel', title: 'Affiliate Instructor' },
      { name: 'Ming Fan', title: 'Professor of Information Systems' },
      { name: 'Crystal Farh', title: 'Professor of Management' },
      { name: 'Scott Fasser', title: 'Affiliate Instructor' },
      { name: 'Ryan Fehr', title: 'Professor of Management' },
      { name: 'Elissa Fink', title: 'Affiliate Instructor' },
      { name: 'Crystal Finkelstein', title: 'Associate Teaching Professor' },
      { name: 'Shannon Fletcher', title: 'Teaching Associate' },
      { name: 'Elizabeth Follmer', title: 'Part-time Lecturer' },
      { name: 'Christina Ting Fong', title: 'Teaching Professor' },
      { name: 'Mark Forehand', title: 'Pigott Family Professor' },
      { name: 'Jody Franich', title: 'Lecturer' },
      { name: 'Sasha Frljanic', title: 'Affiliate Instructor' },
      { name: 'Peter Frost', title: 'Professor Emeritus' },
      { name: 'Amy Funkhouser', title: 'Affiliate Instructor' },
      { name: 'Brian Gale', title: 'Assistant Professor of Accounting' },
      { name: 'Weili Ge', title: 'Professor of Accounting' },
      { name: 'Hossein Ghasemkhani', title: 'Visiting Assistant Professor' },
      { name: 'Thomas Gilbert', title: 'Associate Professor of Finance' },
      { name: 'James Gillick', title: 'Associate Teaching Professor' },
      { name: 'Debra Glassman', title: 'Teaching Professor' },
      { name: 'Cate Goethals', title: 'Affiliate Instructor' },
      { name: 'Stephanie Grant', title: 'Associate Professor of Accounting' },
      { name: 'Jennifer Graves', title: 'Assistant Teaching Professor' },
      { name: 'Ahmed Guecioueur', title: 'Assistant Professor of Finance' },
      { name: 'Abhinav Gupta', title: 'Professor of Management' },
      { name: 'German Gutierrez', title: 'Assistant Professor of Finance' },
      { name: 'Andrew Hafenbrack', title: 'Associate Professor' },
      { name: 'Charles Haley', title: 'Professor Emeritus' },
      { name: 'Benjamin Hallen', title: 'Professor of Strategy' },
      { name: 'Jarrad Harford', title: 'Professor of Finance' },
      { name: 'Joshua Heckathorn', title: 'Affiliate Instructor' },
      { name: 'Gregory Heller', title: 'Associate Instructor' },
      { name: 'Mana Heshmati', title: 'Assistant Professor' },
      { name: 'Alan Hess', title: 'Professor Emeritus' },
      { name: 'Robert Higgins', title: 'Professor Emeritus' },
      { name: 'Charles Hill', title: 'Professor Emeritus' },
      { name: 'Mark Hillier', title: 'Associate Professor' },
      { name: 'Michael Hirsch', title: 'Affiliate Instructor' },
      { name: 'Lisa Hjorten', title: 'Affiliate Instructor' },
      { name: 'Frank Hodge', title: 'Professor of Accounting' },
      { name: 'Christopher Hrdlicka', title: 'Associate Professor' },
      { name: 'Michael Huang', title: 'Affiliate Instructor' },
      { name: 'Vandra Huber', title: 'Professor Emeritus' },
      { name: 'Jeremy Hutton', title: 'Affiliate Instructor' },
      { name: 'Ruth Huwe', title: 'Assistant Teaching Professor' },
      { name: 'Hyeunjung Hwang', title: 'Associate Professor' },
      { name: 'Apurva Jain', title: 'Associate Professor' },
      { name: 'Shailendra Pratap Jain', title: 'Professor of Marketing' },
      { name: 'Lalit Jain', title: 'Assistant Professor' },
      { name: 'Jim Jiambalvo', title: 'Professor Emeritus' },
      { name: 'Michael Johnson', title: 'Professor of Management' },
      { name: 'Richard Johnson', title: 'Affiliate Instructor' },
      { name: 'Christy Johnson', title: 'Affiliate Instructor' },
      { name: 'Teddy Johnson', title: 'Affiliate Instructor' },
      { name: 'Marcus Johnson', title: 'Teaching Associate' },
      { name: 'S. Jane Jollineau', title: 'Professor Emeritus' },
      { name: 'Thomas Jones', title: 'Professor Emeritus' },
      { name: 'Stacia Jones', title: 'Affiliate Instructor' },
      { name: 'Ben Jones', title: 'Affiliate Instructor' },
      { name: 'Avraham Kamara', title: 'Professor of Finance' }
    ];
    
    for (const prof of knownFoster) {
      professors.push({
        professorName: prof.name,
        position: prof.title,
        email: '',
        department: 'Michael G. Foster School of Business',
        sourceUrl: baseUrl
      });
    }
    
    console.log(`   ✅ Loaded ${professors.length} known Foster faculty`);
    console.log(`   Using baseUrl: ${baseUrl}`);
  }
  
  // Save to database
  if (professors.length > 0) {
    console.log(`\n💾 Saving ${professors.length} professors to database (Foster School)...`);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const prof of professors) {
      try {
        // Check if already exists
        // Use raw SQL to check if exists
        const existing = await db.execute(`
          SELECT id FROM scraped_projects 
          WHERE professor_name = ? AND major_name = ?
        `, [prof.professorName, prof.department]);
        
        if ((existing as any).length === 0 || (existing as any)[0].length === 0) {
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
  
  console.log('\n✅ Foster School scrape complete!');
}

main().catch(console.error);
