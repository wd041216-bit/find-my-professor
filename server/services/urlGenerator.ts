import { invokeLLM } from '../_core/llm';
import axios from 'axios';
import { getDb } from '../db';
import { professorUrlCache } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * URL Generator Service with Caching and Batch Generation
 * 
 * Optimizes token consumption by:
 * 1. Caching generated URLs for 30 days
 * 2. Batch generating URLs in a single LLM call
 */

export interface ProjectInfo {
  projectName: string;
  professorName: string;
  department: string;
  university: string;
}

export interface BatchUrlResult {
  projectName: string;
  professorName: string;
  url: string;
  urlType: string;
  fromCache: boolean;
}

export class UrlGeneratorService {
  
  /**
   * Get cached URL for a professor/project
   */
  private static async getCachedUrl(
    professorName: string,
    university: string,
    department: string
  ): Promise<{ url: string; urlType: string } | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      const cached = await db
        .select()
        .from(professorUrlCache)
        .where(
          and(
            eq(professorUrlCache.professorName, professorName),
            eq(professorUrlCache.university, university),
            eq(professorUrlCache.department, department)
          )
        )
        .limit(1);

      if (cached.length > 0 && cached[0].isAccessible) {
        const cacheEntry = cached[0];
        const now = new Date();
        const expiresAt = new Date(cacheEntry.expiresAt);

        // Check if cache is still valid
        if (now < expiresAt) {
          console.log(
            `[URL Generator] ✅ Cache HIT for ${professorName} at ${university}: ${cacheEntry.url}`
          );

          // Update hit count
          const dbUpdate = await getDb();
          if (dbUpdate) {
            await dbUpdate
              .update(professorUrlCache)
              .set({ hitCount: cacheEntry.hitCount + 1 })
              .where(eq(professorUrlCache.id, cacheEntry.id));
          }

          return {
            url: cacheEntry.url,
            urlType: cacheEntry.urlType,
          };
        } else {
          console.log(
            `[URL Generator] ⚠️ Cache expired for ${professorName} at ${university}`
          );
        }
      }

      console.log(
        `[URL Generator] ❌ Cache MISS for ${professorName} at ${university}`
      );
      return null;
    } catch (error) {
      console.error('[URL Generator] Error checking cache:', error);
      return null;
    }
  }

  /**
   * Save URL to cache
   */
  private static async saveToCache(
    professorName: string,
    university: string,
    department: string,
    url: string,
    urlType: string,
    isAccessible: boolean
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Cache for 30 days

      const db = await getDb();
      if (!db) return;

      await db.insert(professorUrlCache).values({
        professorName,
        university,
        department,
        url,
        urlType: urlType as any,
        isAccessible,
        expiresAt,
      });

      console.log(
        `[URL Generator] ✅ Saved to cache: ${professorName} at ${university} -> ${url}`
      );
    } catch (error: any) {
      // Ignore duplicate key errors
      if (!error.message?.includes('Duplicate entry')) {
        console.error('[URL Generator] Error saving to cache:', error);
      }
    }
  }

  /**
   * Test if a URL is accessible
   */
  private static async testUrlAccessible(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        timeout,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });
      
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      // Try GET if HEAD fails
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

  /**
   * Generate URLs for multiple projects in a single LLM call (BATCH)
   * This is the main entry point for optimized URL generation
   */
  static async generateBatchUrls(
    projects: ProjectInfo[]
  ): Promise<BatchUrlResult[]> {
    console.log(
      `[URL Generator] 🚀 Generating URLs for ${projects.length} projects in batch`
    );

    const results: BatchUrlResult[] = [];
    const projectsNeedingGeneration: ProjectInfo[] = [];

    // Step 1: Check cache for each project
    for (const project of projects) {
      const cached = await this.getCachedUrl(
        project.professorName,
        project.university,
        project.department
      );

      if (cached) {
        results.push({
          projectName: project.projectName,
          professorName: project.professorName,
          url: cached.url,
          urlType: cached.urlType,
          fromCache: true,
        });
      } else {
        projectsNeedingGeneration.push(project);
      }
    }

    // Step 2: Generate URLs for projects not in cache (BATCH)
    if (projectsNeedingGeneration.length > 0) {
      console.log(
        `[URL Generator] ${projectsNeedingGeneration.length} projects need URL generation`
      );

      const batchPrompt = `You are a research project URL finder. Generate URLs for the following research projects.

**Projects:**
${projectsNeedingGeneration
  .map(
    (p, i) =>
      `${i + 1}. Project: ${p.projectName}\n   Professor: ${p.professorName}\n   Department: ${p.department}\n   University: ${p.university}`
  )
  .join('\n\n')}

**Instructions:**
- For each project, find the professor's faculty page URL (BEST)
- If professor page not found, use department/school page URL
- Always return VALID, WORKING URLs (not 404 pages)
- Use official university domains

**Return a JSON array with this structure:**
[
  {
    "projectIndex": 1,
    "url": "string (the URL)",
    "type": "professor_page" | "lab_page" | "department_page" | "school_page" | "university_homepage",
    "confidence": "high" | "medium" | "low"
  },
  ...
]`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content:
                'You are a research project URL finder. Always return valid, working URLs. Return only valid JSON array.',
            },
            { role: 'user', content: batchPrompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'batch_url_results',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  urls: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        projectIndex: { type: 'integer' },
                        url: { type: 'string' },
                        type: {
                          type: 'string',
                          enum: [
                            'professor_page',
                            'lab_page',
                            'department_page',
                            'school_page',
                            'university_homepage',
                          ],
                        },
                        confidence: {
                          type: 'string',
                          enum: ['high', 'medium', 'low'],
                        },
                      },
                      required: ['projectIndex', 'url', 'type', 'confidence'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['urls'],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          console.log('[URL Generator] No response from LLM');
          // Fallback: use department URLs
          for (const project of projectsNeedingGeneration) {
            const deptUrl = await this.generateDepartmentUrl(
              project.department,
              project.university
            );
            results.push({
              projectName: project.projectName,
              professorName: project.professorName,
              url: deptUrl,
              urlType: 'department_page',
              fromCache: false,
            });
          }
          return results;
        }

        const contentStr =
          typeof content === 'string' ? content : JSON.stringify(content);
        const batchResult = JSON.parse(contentStr);

        // Step 3: Verify URLs and save to cache
        for (const urlData of batchResult.urls) {
          const project = projectsNeedingGeneration[urlData.projectIndex - 1];
          if (!project) continue;

          let finalUrl = urlData.url;
          let finalType = urlData.type;

          // Verify URL accessibility
          const isAccessible = await this.testUrlAccessible(urlData.url);

          if (!isAccessible) {
            console.log(
              `[URL Generator] ⚠️ URL not accessible: ${urlData.url}, falling back to department page`
            );
            finalUrl = await this.generateDepartmentUrl(
              project.department,
              project.university
            );
            finalType = 'department_page';
          }

          // Save to cache
          await this.saveToCache(
            project.professorName,
            project.university,
            project.department,
            finalUrl,
            finalType,
            isAccessible
          );

          results.push({
            projectName: project.projectName,
            professorName: project.professorName,
            url: finalUrl,
            urlType: finalType,
            fromCache: false,
          });
        }
      } catch (error) {
        console.error('[URL Generator] Error in batch generation:', error);
        // Fallback: use department URLs
        for (const project of projectsNeedingGeneration) {
          const deptUrl = await this.generateDepartmentUrl(
            project.department,
            project.university
          );
          results.push({
            projectName: project.projectName,
            professorName: project.professorName,
            url: deptUrl,
            urlType: 'department_page',
            fromCache: false,
          });
        }
      }
    }

    console.log(
      `[URL Generator] ✅ Batch generation complete: ${results.filter((r) => r.fromCache).length} from cache, ${results.filter((r) => !r.fromCache).length} newly generated`
    );
    return results;
  }
}
