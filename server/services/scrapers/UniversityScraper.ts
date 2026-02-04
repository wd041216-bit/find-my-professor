import axios from 'axios';
import * as cheerio from 'cheerio';
import { invokeLLMWithLimit } from '../llmQueue';

/**
 * University Scraper Base Class
 * 
 * Provides common functionality for scraping university research project data.
 * Implements hybrid approach: 90% CSS selectors + 10% LLM assistance
 */

export interface ScrapedProject {
  professorName: string;
  labName: string;
  researchArea: string;
  projectTitle: string;
  projectDescription: string;
  requirements: string;
  contactEmail: string;
  sourceUrl: string;
}

export interface SelectorConfig {
  labList?: string;
  labName?: string;
  labUrl?: string;
  professorName?: string;
  professorEmail?: string;
  researchArea?: string;
  projectTitle?: string;
  projectDescription?: string;
  requirements?: string;
}

export abstract class UniversityScraper {
  abstract universityName: string;
  abstract baseUrl: string;
  abstract selectors: SelectorConfig;
  
  /**
   * Main method to scrape projects for a given major
   */
  abstract scrapeProjects(major: string, degreeLevel: string): Promise<ScrapedProject[]>;
  
  /**
   * Fetch HTML content from a URL with retry logic
   */
  protected async fetchHTML(url: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`[Scraper] Fetching ${url} (attempt ${i + 1}/${retries})`);
        
        const response = await axios.get(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });
        
        console.log(`[Scraper] Successfully fetched ${url}`);
        return response.data;
      } catch (error) {
        console.error(`[Scraper] Error fetching ${url} (attempt ${i + 1}/${retries}):`, error);
        
        if (i === retries - 1) {
          throw new Error(`Failed to fetch ${url} after ${retries} attempts: ${error}`);
        }
        
        // Exponential backoff
        const delay = 1000 * Math.pow(2, i);
        console.log(`[Scraper] Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    throw new Error(`Failed to fetch ${url}`);
  }
  
  /**
   * Extract data using CSS selectors (90% of cases)
   */
  protected extractWithSelectors(
    html: string,
    selectors: SelectorConfig
  ): Partial<ScrapedProject> {
    const $ = cheerio.load(html);
    const data: Partial<ScrapedProject> = {};
    
    if (selectors.professorName) {
      data.professorName = $(selectors.professorName).first().text().trim();
    }
    
    if (selectors.labName) {
      data.labName = $(selectors.labName).first().text().trim();
    }
    
    if (selectors.researchArea) {
      data.researchArea = $(selectors.researchArea).first().text().trim();
    }
    
    if (selectors.projectTitle) {
      data.projectTitle = $(selectors.projectTitle).first().text().trim();
    }
    
    if (selectors.projectDescription) {
      data.projectDescription = $(selectors.projectDescription).first().text().trim();
    }
    
    if (selectors.requirements) {
      data.requirements = $(selectors.requirements).first().text().trim();
    }
    
    if (selectors.professorEmail) {
      const email = $(selectors.professorEmail).first().attr('href') || 
                    $(selectors.professorEmail).first().text();
      data.contactEmail = email.replace('mailto:', '').trim();
    }
    
    return data;
  }
  
  /**
   * Extract data using LLM assistance (10% of cases, when CSS fails)
   */
  protected async extractWithLLM(
    html: string,
    context: { universityName: string; major: string }
  ): Promise<Partial<ScrapedProject>> {
    console.log(`[Scraper] Using LLM to extract data from ${context.universityName}`);
    
    // Clean HTML to reduce token usage
    const $ = cheerio.load(html);
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('footer').remove();
    const cleanedHTML = $.html();
    
    // Truncate if too long (max 8000 chars to keep token usage reasonable)
    const truncatedHTML = cleanedHTML.length > 8000 
      ? cleanedHTML.substring(0, 8000) + '...[truncated]'
      : cleanedHTML;
    
    const prompt = `You are a web scraping assistant. Extract REAL RESEARCH PROJECT/LAB information from the following HTML content from ${context.universityName} in the field of ${context.major}.

**IMPORTANT FILTERING RULES:**
- ONLY extract information about research labs, research groups, or research opportunities
- IGNORE course descriptions, class syllabi, or academic courses (even if they mention "research")
- IGNORE teaching-related content
- Focus on faculty research labs, ongoing research projects, or research assistant positions

HTML Content:
${truncatedHTML}

Extract the following information (if available):
1. Professor name (principal investigator)
2. Lab/Research group name
3. Research area/focus
4. Project title (if mentioned)
5. Project description
6. Requirements (GPA, skills, experience)
7. Contact email

If the content is about a COURSE (not a research lab/project), return all fields as "Not a research project".

Return ONLY a JSON object with these fields:
{
  "professorName": "...",
  "labName": "...",
  "researchArea": "...",
  "projectTitle": "...",
  "projectDescription": "...",
  "requirements": "...",
  "contactEmail": "..."
}`;

    try {
      const response = await invokeLLMWithLimit({
        messages: [
          { role: 'system', content: 'You are a precise data extraction assistant. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'project_extraction',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                professorName: { type: 'string' },
                labName: { type: 'string' },
                researchArea: { type: 'string' },
                projectTitle: { type: 'string' },
                projectDescription: { type: 'string' },
                requirements: { type: 'string' },
                contactEmail: { type: 'string' },
              },
              required: ['professorName', 'labName', 'researchArea', 'projectTitle', 'projectDescription', 'requirements', 'contactEmail'],
              additionalProperties: false,
            },
          },
        },
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in LLM response');
      }
      
      const data = JSON.parse(content);
      console.log(`[Scraper] LLM extraction successful`);
      return data;
    } catch (error) {
      console.error(`[Scraper] LLM extraction failed:`, error);
      throw error;
    }
  }
  
  /**
   * Validate extracted data and filter out courses
   */
  protected validateProject(project: Partial<ScrapedProject>): boolean {
    // Filter out courses (LLM returns "Not a research project" for courses)
    if (project.professorName === 'Not a research project' || 
        project.labName === 'Not a research project') {
      console.log(`[Scraper] Filtered out course content`);
      return false;
    }
    
    // Filter out content with course-related keywords
    const text = `${project.projectTitle} ${project.projectDescription} ${project.labName}`.toLowerCase();
    const courseKeywords = [
      'course syllabus',
      'class schedule',
      'lecture notes',
      'homework',
      'assignment',
      'midterm',
      'final exam',
      'course description',
      'prerequisites:',
      'textbook',
      'grading policy',
    ];
    
    for (const keyword of courseKeywords) {
      if (text.includes(keyword)) {
        console.log(`[Scraper] Filtered out course content (keyword: ${keyword})`);
        return false;
      }
    }
    
    // At minimum, we need professor name or lab name, and some description
    const hasIdentity = !!(project.professorName || project.labName);
    const hasDescription = !!(project.projectDescription || project.researchArea);
    
    return hasIdentity && hasDescription;
  }
  
  /**
   * Fill in missing fields with defaults
   */
  protected fillDefaults(
    project: Partial<ScrapedProject>,
    sourceUrl: string
  ): ScrapedProject {
    return {
      professorName: project.professorName || 'Not specified',
      labName: project.labName || 'Research Lab',
      researchArea: project.researchArea || 'Various research areas',
      projectTitle: project.projectTitle || 'Research Opportunity',
      projectDescription: project.projectDescription || 'Please contact for more details',
      requirements: project.requirements || 'Contact lab for specific requirements',
      contactEmail: project.contactEmail || 'See website for contact',
      sourceUrl: sourceUrl,
    };
  }
  
  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get major-specific URL (to be overridden by subclasses if needed)
   */
  protected getMajorUrl(major: string): string {
    // Default implementation, subclasses can override
    return this.baseUrl;
  }
}
