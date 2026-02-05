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
