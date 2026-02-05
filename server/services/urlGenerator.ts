import { invokeLLM } from '../_core/llm';
import axios from 'axios';
import mysql from 'mysql2/promise';

/**
 * URL Generator Service
 * 
 * Uses LLM to generate university department URLs when not found in mapping table.
 * Implements URL validation and caching for efficiency.
 */

export interface GeneratedUrl {
  url: string;
  confidence: 'high' | 'medium' | 'low';
  alternatives: string[];
}

export class UrlGeneratorService {
  
  /**
   * Generate project URL with fallback strategy
   * Priority 1: Professor's faculty page
   * Priority 2: Research lab/group page
   * Priority 3: Department page
   * Priority 4: School/college page
   * Priority 5: University homepage
   */
  static async generateProjectUrl(
    projectName: string,
    professorName: string,
    department: string,
    university: string
  ): Promise<string | null> {
    try {
      console.log(`[URL Generator] Generating URL for: ${projectName} - ${professorName} at ${university}`);
      
      const prompt = `You are a research project URL finder. Given the following information, generate the most appropriate URL.

**Project Information:**
- Project: ${projectName}
- Professor: ${professorName}
- Department: ${department}
- University: ${university}

**URL Priority (choose the best available):**
1. Professor's faculty page at the university (BEST)
2. Research lab/group page
3. Department page (if professor page not found)
4. School/college page (if department page not found)
5. University homepage (LAST RESORT)

**Instructions:**
- Search your knowledge for the professor's official faculty page URL
- If the professor exists, return their faculty page URL
- If the professor doesn't exist or you're unsure, return the department/school page URL
- Always return a VALID, WORKING URL (not a 404 page)
- Use the official university domain

**Examples:**
- Good: https://law.yale.edu/jack-m-balkin (professor page)
- Good: https://www.cs.washington.edu/research/human-centered-computing/ (research group)
- Acceptable: https://www.cs.washington.edu/ (department page)
- Last resort: https://www.washington.edu/ (university homepage)

Return ONLY a JSON object with this structure:
{
  "url": "string (the URL)",
  "type": "professor_page" | "lab_page" | "department_page" | "school_page" | "university_homepage",
  "confidence": "high" | "medium" | "low",
  "reasoning": "string (brief explanation)"
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a research project URL finder. Always return valid, working URLs. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "url_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                url: { type: "string" },
                type: { 
                  type: "string",
                  enum: ["professor_page", "lab_page", "department_page", "school_page", "university_homepage"]
                },
                confidence: { 
                  type: "string",
                  enum: ["high", "medium", "low"]
                },
                reasoning: { type: "string" }
              },
              required: ["url", "type", "confidence", "reasoning"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.log('[URL Generator] No response from LLM');
        return null;
      }

      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const result = JSON.parse(contentStr);
      console.log(`[URL Generator] Generated URL: ${result.url} (${result.type}, confidence: ${result.confidence})`);
      console.log(`[URL Generator] Reasoning: ${result.reasoning}`);
      
      // Verify the URL is accessible
      console.log(`[URL Generator] Verifying URL accessibility...`);
      const isAccessible = await this.testUrlAccessible(result.url);

      if (isAccessible) {
        console.log(`[URL Generator] ✅ URL verified and accessible`);
        return result.url;
      }

      console.log(
        `[URL Generator] ⚠️ URL not accessible (${result.url}), falling back to department page`
      );

      // Fallback to department/school page
      const departmentUrl = await this.generateDepartmentUrl(
        department,
        university
      );

      // Verify department URL
      const isDepartmentAccessible = await this.testUrlAccessible(departmentUrl);
      if (isDepartmentAccessible) {
        console.log(
          `[URL Generator] ✅ Department URL verified: ${departmentUrl}`
        );
        return departmentUrl;
      }

      console.log(
        `[URL Generator] ⚠️ Department URL not accessible, falling back to university homepage`
      );

      // Final fallback to university homepage
      const universityUrl = this.generateUniversityHomepage(university);
      console.log(
        `[URL Generator] ✅ Using university homepage: ${universityUrl}`
      );
      return universityUrl;
    } catch (error) {
      console.error('[URL Generator] Error generating project URL:', error);
      return null;
    }
  }
  
  /**
   * Generate department/school URL as fallback
   */
  private static async generateDepartmentUrl(
    departmentName: string,
    universityName: string
  ): Promise<string> {
    console.log(
      `[URL Generator] Generating department URL for ${departmentName} at ${universityName}`
    );

    const prompt = `Find the official website URL for the ${departmentName} department/school at ${universityName}.

IMPORTANT: Return ONLY a valid, accessible URL that exists. Common patterns:
- For Yale Law School: https://law.yale.edu/
- For UW Computer Science: https://www.cs.washington.edu/
- For Stanford CS: https://cs.stanford.edu/

If you cannot find the department page, return the university homepage.

Return ONLY the URL, nothing else.`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a URL finder. Return only valid, accessible URLs. If unsure, return the university homepage.",
          },
          { role: "user", content: prompt },
        ],
      });

      const content = response.choices[0].message.content;
      const url = (typeof content === 'string' ? content : JSON.stringify(content)).trim();
      console.log(`[URL Generator] Generated department URL: ${url}`);
      return url;
    } catch (error) {
      console.error("[URL Generator] Error generating department URL:", error);
      // Fallback to university homepage
      return this.generateUniversityHomepage(universityName);
    }
  }

  /**
   * Generate university homepage URL
   */
  private static generateUniversityHomepage(universityName: string): string {
    // Common university URL patterns
    const urlMap: Record<string, string> = {
      "Yale University": "https://www.yale.edu/",
      "University of Washington": "https://www.washington.edu/",
      "Stanford University": "https://www.stanford.edu/",
      "Harvard University": "https://www.harvard.edu/",
      "MIT": "https://www.mit.edu/",
      "Princeton University": "https://www.princeton.edu/",
      "Columbia University": "https://www.columbia.edu/",
      "University of California, Berkeley": "https://www.berkeley.edu/",
      "Cornell University": "https://www.cornell.edu/",
      "University of Pennsylvania": "https://www.upenn.edu/",
    };

    const url = urlMap[universityName];
    if (url) {
      console.log(
        `[URL Generator] Using known university URL: ${url} for ${universityName}`
      );
      return url;
    }

    // Generate URL from university name
    const domain = universityName
      .toLowerCase()
      .replace(/university of /g, "")
      .replace(/,/g, "")
      .replace(/ /g, "")
      .replace(/\./g, "");
    const generatedUrl = `https://www.${domain}.edu/`;
    console.log(
      `[URL Generator] Generated university URL: ${generatedUrl} for ${universityName}`
    );
    return generatedUrl;
  }

  // Database connection pool
  private static connectionPool: mysql.Pool | null = null;
  
  private static getConnectionPool(): mysql.Pool {
    if (!this.connectionPool && process.env.DATABASE_URL) {
      this.connectionPool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 10,
        waitForConnections: true,
      });
    }
    if (!this.connectionPool) {
      throw new Error('Database connection not available');
    }
    return this.connectionPool;
  }
  
  /**
   * Generate university department URL using LLM
   * Returns the most likely URL and alternatives
   */
  static async generateUniversityUrl(
    universityName: string,
    major: string = 'computer science'
  ): Promise<GeneratedUrl> {
    console.log(`[UrlGenerator] Generating URL for ${universityName} - ${major}`);
    
    const prompt = `You are a university website URL expert. Generate the most likely URL for the ${major} department at ${universityName}.

Instructions:
1. Return the official department website URL (not the main university homepage)
2. For computer science, common patterns are:
   - https://cs.university.edu
   - https://www.cs.university.edu
   - https://cse.university.edu (Computer Science & Engineering)
   - https://eecs.university.edu (Electrical Engineering & Computer Science)
   - https://www.university.edu/cs
3. Also provide 2-3 alternative URLs that might be correct
4. Rate your confidence: high (90%+ sure), medium (70-90%), low (<70%)

University: ${universityName}
Major: ${major}

Respond in JSON format:
{
  "primaryUrl": "https://...",
  "confidence": "high|medium|low",
  "alternatives": ["https://...", "https://..."],
  "reasoning": "Brief explanation"
}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates university department URLs.' },
          { role: 'user', content: prompt }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'university_url',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                primaryUrl: { type: 'string', description: 'The most likely URL' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                alternatives: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Alternative URLs'
                },
                reasoning: { type: 'string', description: 'Brief explanation' }
              },
              required: ['primaryUrl', 'confidence', 'alternatives', 'reasoning'],
              additionalProperties: false
            }
          }
        }
      });
      
      const content = response.choices[0].message.content;
      const result = JSON.parse(typeof content === 'string' ? content : '{}');
      
      console.log(`[UrlGenerator] Generated URL: ${result.primaryUrl} (confidence: ${result.confidence})`);
      console.log(`[UrlGenerator] Reasoning: ${result.reasoning}`);
      
      return {
        url: result.primaryUrl,
        confidence: result.confidence,
        alternatives: result.alternatives || []
      };
      
    } catch (error) {
      console.error(`[UrlGenerator] Error generating URL:`, error);
      throw new Error(`Failed to generate URL for ${universityName}`);
    }
  }
  
  /**
   * Test if a URL is accessible
   * Returns true if URL returns 200-399 status code
   */
  static async testUrlAccessible(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        timeout,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });
      
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      // Try GET if HEAD fails (some servers don't support HEAD)
      try {
        const response = await axios.get(url, {
          timeout,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
          maxContentLength: 1024 * 10 // Only download first 10KB
        });
        
        return response.status >= 200 && response.status < 400;
      } catch {
        return false;
      }
    }
  }
  
  /**
   * Get cached URL from database
   */
  static async getCachedUrl(
    universityName: string,
    major: string = 'computer science'
  ): Promise<string | null> {
    try {
      const pool = this.getConnectionPool();
      
      const [rows] = await pool.execute(
        `SELECT base_url, is_accessible, last_validated 
         FROM university_url_cache 
         WHERE university_name = ? AND major = ? 
         ORDER BY success_count DESC, last_validated DESC 
         LIMIT 1`,
        [universityName, major]
      );
      
      const cached = (rows as any[])[0];
      if (cached && cached.is_accessible) {
        console.log(`[UrlGenerator] Cache HIT for ${universityName} - ${major}: ${cached.base_url}`);
        return cached.base_url;
      }
      
      console.log(`[UrlGenerator] Cache MISS for ${universityName} - ${major}`);
      return null;
    } catch (error) {
      console.error(`[UrlGenerator] Error checking cache:`, error);
      return null;
    }
  }
  
  /**
   * Save URL to cache
   */
  static async cacheUrl(
    universityName: string,
    major: string,
    url: string,
    source: 'llm_generated' | 'manual' | 'validated',
    confidence: 'high' | 'medium' | 'low',
    isAccessible: boolean
  ): Promise<void> {
    try {
      const pool = this.getConnectionPool();
      
      await pool.execute(
        `INSERT INTO university_url_cache 
         (university_name, major, base_url, source, confidence, is_accessible, last_validated) 
         VALUES (?, ?, ?, ?, ?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE 
         base_url = VALUES(base_url), 
         source = VALUES(source), 
         confidence = VALUES(confidence), 
         is_accessible = VALUES(is_accessible), 
         last_validated = NOW(), 
         updatedAt = NOW()`,
        [universityName, major, url, source, confidence, isAccessible]
      );
      
      console.log(`[UrlGenerator] Cached URL for ${universityName}: ${url}`);
    } catch (error) {
      console.error(`[UrlGenerator] Error caching URL:`, error);
    }
  }
  
  /**
   * Update URL success/failure count
   */
  static async updateUrlStats(
    universityName: string,
    major: string,
    success: boolean
  ): Promise<void> {
    try {
      const pool = this.getConnectionPool();
      
      const field = success ? 'success_count' : 'failure_count';
      await pool.execute(
        `UPDATE university_url_cache 
         SET ${field} = ${field} + 1, 
         last_validated = NOW(), 
         updatedAt = NOW() 
         WHERE university_name = ? AND major = ?`,
        [universityName, major]
      );
      
      console.log(`[UrlGenerator] Updated stats for ${universityName}: ${success ? 'success' : 'failure'}`);
    } catch (error) {
      console.error(`[UrlGenerator] Error updating stats:`, error);
    }
  }
  
  /**
   * Generate and validate URL
   * Tests primary URL and alternatives, returns the first working one
   */
  static async generateAndValidateUrl(
    universityName: string,
    major: string = 'computer science'
  ): Promise<string | null> {
    console.log(`[UrlGenerator] Generating and validating URL for ${universityName}`);
    
    try {
      const generated = await this.generateUniversityUrl(universityName, major);
      
      // Test primary URL first
      console.log(`[UrlGenerator] Testing primary URL: ${generated.url}`);
      if (await this.testUrlAccessible(generated.url)) {
        console.log(`[UrlGenerator] ✓ Primary URL is accessible`);
        return generated.url;
      }
      
      // Test alternatives
      for (const altUrl of generated.alternatives) {
        console.log(`[UrlGenerator] Testing alternative URL: ${altUrl}`);
        if (await this.testUrlAccessible(altUrl)) {
          console.log(`[UrlGenerator] ✓ Alternative URL is accessible`);
          return altUrl;
        }
      }
      
      console.log(`[UrlGenerator] ✗ No accessible URL found`);
      
      // Return primary URL even if not accessible (爬虫会处理失败情况)
      return generated.url;
      
    } catch (error) {
      console.error(`[UrlGenerator] Error in generateAndValidateUrl:`, error);
      return null;
    }
  }
}
