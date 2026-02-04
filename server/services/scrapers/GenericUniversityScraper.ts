import { UniversityScraper, ScrapedProject, SelectorConfig } from './UniversityScraper';
import * as cheerio from 'cheerio';

/**
 * Generic University Scraper
 * 
 * Intelligent scraper that tries multiple common CSS selector patterns
 * and falls back to LLM assistance when extraction fails.
 * 
 * This approach:
 * - Works for most university websites without manual configuration
 * - Automatically adapts to structure changes
 * - Still saves tokens by trying CSS first
 * - Easy to extend to new universities
 */

export class GenericUniversityScraper extends UniversityScraper {
  universityName: string;
  baseUrl: string;
  selectors: SelectorConfig = {}; // Not used, we try multiple patterns
  
  // Common selector patterns found across university websites
  private static COMMON_PATTERNS = {
    professorName: [
      '.faculty-name',
      '.professor-name',
      '.pi-name',
      '.researcher-name',
      'h2.name',
      'h3.name',
      '.contact .name',
      '[itemprop="name"]',
    ],
    labName: [
      '.lab-name',
      '.lab-title',
      '.group-name',
      '.research-group',
      'h1.title',
      'h2.title',
      '.page-title',
    ],
    researchArea: [
      '.research-area',
      '.research-focus',
      '.research-interests',
      '.keywords',
      '.topics',
      '[itemprop="keywords"]',
    ],
    projectTitle: [
      '.project-title',
      '.opportunity-title',
      '.position-title',
      'h3',
      'h4',
    ],
    projectDescription: [
      '.project-description',
      '.description',
      '.summary',
      '.abstract',
      'p.desc',
    ],
    requirements: [
      '.requirements',
      '.qualifications',
      '.prerequisites',
      '.skills',
    ],
    email: [
      'a[href^="mailto:"]',
      '.email',
      '.contact-email',
      '[itemprop="email"]',
    ],
  };
  
  constructor(universityName: string, baseUrl: string) {
    super();
    this.universityName = universityName;
    this.baseUrl = baseUrl;
  }
  
  /**
   * Scrape projects for a given major
   */
  async scrapeProjects(major: string, degreeLevel: string): Promise<ScrapedProject[]> {
    console.log(`[GenericScraper] Scraping ${this.universityName} for ${major} projects...`);
    
    try {
      // Try to find research/faculty pages
      const urls = this.generateSearchUrls(major);
      
      const allProjects: ScrapedProject[] = [];
      
      for (const url of urls) {
        try {
          const html = await this.fetchHTML(url);
          const projects = await this.extractProjectsFromPage(html, url, major);
          allProjects.push(...projects);
          
          // Limit to avoid too many requests
          if (allProjects.length >= 10) {
            break;
          }
        } catch (error) {
          console.error(`[GenericScraper] Error scraping ${url}:`, error);
          // Continue to next URL
        }
      }
      
      console.log(`[GenericScraper] Found ${allProjects.length} projects from ${this.universityName}`);
      return allProjects;
      
    } catch (error) {
      console.error(`[GenericScraper] Error scraping ${this.universityName}:`, error);
      // Fall back to LLM-generated data as last resort
      return this.generateFallbackProjects(major, degreeLevel);
    }
  }
  
  /**
   * Generate possible URLs to search for research opportunities
   * Prioritize URLs that are more likely to contain research labs/projects
   */
  private generateSearchUrls(major: string): string[] {
    const majorSlug = major.toLowerCase().replace(/\s+/g, '-');
    const baseUrl = this.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    
    return [
      `${baseUrl}/labs`,              // Research labs (highest priority)
      `${baseUrl}/research`,          // Research page
      `${baseUrl}/research-groups`,   // Research groups
      `${baseUrl}/faculty/research`,  // Faculty research
      `${baseUrl}/opportunities`,     // Research opportunities
      `${baseUrl}/positions`,         // Research positions
      // Note: Removed /faculty alone as it often links to course pages
    ];
  }
  
  /**
   * Extract projects from a single page
   */
  private async extractProjectsFromPage(
    html: string,
    sourceUrl: string,
    major: string
  ): Promise<ScrapedProject[]> {
    const $ = cheerio.load(html);
    
    // Try to find individual lab/project cards or sections
    const containers = this.findContainers($);
    
    if (containers.length === 0) {
      console.log(`[GenericScraper] No containers found, using LLM for entire page`);
      // Use LLM to extract from entire page
      const extracted = await this.extractWithLLM(html, {
        universityName: this.universityName,
        major: major,
      });
      
      if (this.validateProject(extracted)) {
        return [this.fillDefaults(extracted, sourceUrl)];
      }
      return [];
    }
    
    console.log(`[GenericScraper] Found ${containers.length} potential project containers`);
    
    const projects: ScrapedProject[] = [];
    
    // Try to extract from each container
    for (let i = 0; i < Math.min(containers.length, 10); i++) {
      const container = containers[i];
      const containerHTML = $.html(container);
      
      try {
        // Try CSS extraction first
        const extracted = this.tryExtractWithPatterns(containerHTML);
        
        if (this.validateProject(extracted)) {
          projects.push(this.fillDefaults(extracted, sourceUrl));
        } else {
          // Fall back to LLM for this container
          console.log(`[GenericScraper] CSS extraction insufficient for container ${i}, using LLM`);
          const llmExtracted = await this.extractWithLLM(containerHTML, {
            universityName: this.universityName,
            major: major,
          });
          
          if (this.validateProject(llmExtracted)) {
            projects.push(this.fillDefaults(llmExtracted, sourceUrl));
          }
        }
      } catch (error) {
        console.error(`[GenericScraper] Error extracting container ${i}:`, error);
        // Continue to next container
      }
    }
    
    return projects;
  }
  
  /**
   * Find potential project/lab containers in the page
   * Filter out course-related content
   */
  private findContainers($: cheerio.CheerioAPI): any[] {
    const containerSelectors = [
      '.lab-card',
      '.project-card',
      '.faculty-card',
      '.research-group',
      '.opportunity',
      'article',
      '.card',
      'section.project',
      'div[class*="lab"]',
      'div[class*="project"]',
      'div[class*="research"]',
    ];
    
    // Course-related keywords to filter out (only obvious course indicators)
    // Relaxed to avoid over-filtering research projects
    const courseKeywords = [
      'syllabus',      // Very specific to courses
      'homework',      // Very specific to courses
      'assignment',    // Very specific to courses
      'exam',          // Very specific to courses
      'midterm',       // Very specific to courses
      'final exam',    // Very specific to courses
    ];
    
    for (const selector of containerSelectors) {
      const elements = $(selector).toArray().filter(el => {
        const text = $(el).text().toLowerCase();
        // Filter out elements with course keywords
        return !courseKeywords.some(keyword => text.includes(keyword));
      });
      
      if (elements.length > 0 && elements.length < 50) { // Not too many to avoid noise
        return elements;
      }
    }
    
    // If no specific containers found, try to find sections with headings
    const sections = $('section, div').filter((i, el) => {
      const $el = $(el);
      const text = $el.text().toLowerCase();
      
      // Filter out course-related sections
      if (courseKeywords.some(keyword => text.includes(keyword))) {
        return false;
      }
      
      const hasHeading = $el.find('h2, h3, h4').length > 0;
      const hasText = text.trim().length > 100;
      return hasHeading && hasText;
    }).toArray();
    
    return sections.slice(0, 10); // Limit to 10
  }
  
  /**
   * Try to extract data using common CSS patterns
   */
  private tryExtractWithPatterns(html: string): Partial<ScrapedProject> {
    const $ = cheerio.load(html);
    const data: Partial<ScrapedProject> = {};
    
    // Try each field with multiple patterns
    data.professorName = this.tryPatterns($, GenericUniversityScraper.COMMON_PATTERNS.professorName);
    data.labName = this.tryPatterns($, GenericUniversityScraper.COMMON_PATTERNS.labName);
    data.researchArea = this.tryPatterns($, GenericUniversityScraper.COMMON_PATTERNS.researchArea);
    data.projectTitle = this.tryPatterns($, GenericUniversityScraper.COMMON_PATTERNS.projectTitle);
    data.projectDescription = this.tryPatterns($, GenericUniversityScraper.COMMON_PATTERNS.projectDescription);
    data.requirements = this.tryPatterns($, GenericUniversityScraper.COMMON_PATTERNS.requirements);
    
    // Extract email
    const emailElement = this.tryPatternsElement($, GenericUniversityScraper.COMMON_PATTERNS.email);
    if (emailElement) {
      const href = $(emailElement).attr('href');
      const text = $(emailElement).text();
      data.contactEmail = (href || text).replace('mailto:', '').trim();
    }
    
    return data;
  }
  
  /**
   * Try multiple selector patterns and return first match
   */
  private tryPatterns($: cheerio.CheerioAPI, patterns: string[]): string | undefined {
    for (const pattern of patterns) {
      const text = $(pattern).first().text().trim();
      if (text && text.length > 0 && text.length < 500) {
        return text;
      }
    }
    return undefined;
  }
  
  /**
   * Try multiple selector patterns and return first matching element
   */
  private tryPatternsElement($: cheerio.CheerioAPI, patterns: string[]): any | undefined {
    for (const pattern of patterns) {
      const element = $(pattern).first();
      if (element.length > 0) {
        return element[0];
      }
    }
    return undefined;
  }
  
  /**
   * Generate fallback projects using LLM (last resort)
   */
  private async generateFallbackProjects(
    major: string,
    degreeLevel: string
  ): Promise<ScrapedProject[]> {
    console.log(`[GenericScraper] Generating fallback projects for ${this.universityName}`);
    
    // This is similar to the current implementation, but only used as last resort
    const prompt = `Generate 3-5 realistic research project opportunities at ${this.universityName} in the field of ${major} for ${degreeLevel} students.

For each project, provide:
1. Professor name (realistic name)
2. Lab name
3. Research area (specific sub-field of ${major})
4. Project title
5. Project description (2-3 sentences)
6. Requirements (GPA, skills, experience)
7. Contact email (format: firstname.lastname@university.edu)

Return as JSON array.`;

    try {
      const response = await this.extractWithLLM(`<html><body><p>${prompt}</p></body></html>`, {
        universityName: this.universityName,
        major: major,
      });
      
      // Convert single project to array
      return [this.fillDefaults(response, this.baseUrl)];
    } catch (error) {
      console.error(`[GenericScraper] Fallback generation failed:`, error);
      return [];
    }
  }
}
