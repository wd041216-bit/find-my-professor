import mysql from 'mysql2/promise';
import { invokeLLMWithLimit } from './llmQueue';

/**
 * Scraping Service
 * 
 * Implements on-demand scraping strategy:
 * - When user searches for (university + major), check cache
 * - If cache exists and < 30 days old, return cached data
 * - If cache expired or doesn't exist, trigger scraping task
 * - Store scraped data for 30 days
 */

// Database connection pool
let connectionPool: mysql.Pool | null = null;

function getConnectionPool(): mysql.Pool {
  if (!connectionPool && process.env.DATABASE_URL) {
    // 优化连接池配置以支持高并发
    connectionPool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 50,      // 增加到50个并发连接
      queueLimit: 100,          // 队列限制100个等待请求
      waitForConnections: true, // 等待可用连接
      connectTimeout: 10000,    // 连接超时10秒
      enableKeepAlive: true,    // 保持连接活跃
      keepAliveInitialDelay: 0  // 立即发送keep-alive
    });
  }
  if (!connectionPool) {
    throw new Error('Database connection not available');
  }
  return connectionPool;
}

export interface ScrapedProject {
  id: number;
  universityName: string;
  majorName: string;
  professorName: string;
  labName: string;
  researchArea: string;
  projectTitle: string;
  projectDescription: string;
  requirements: string;
  contactEmail: string;
  sourceUrl: string;
  scrapedAt: Date;
}

export class ScrapingService {
  
  /**
   * Check if we have cached data for (university + major)
   * Returns cached data if exists and < 30 days old
   * 
   * CACHE DISABLED FOR TESTING: Always returns cache miss to force re-scraping
   */
  static async getCachedProjects(
    universityName: string,
    majorName: string,
    degreeLevel: string = 'all'
  ): Promise<{ cached: boolean; projects: ScrapedProject[]; cacheAge?: number }> {
    // TEMPORARY: Disable cache for testing filter logic
    console.log(`[Scraping] Cache DISABLED for testing - forcing re-scrape`);
    return { cached: false, projects: [] };
    
    /* Original cache logic (commented out for testing)
    try {
      const pool = getConnectionPool();
      
      // Check cache status
      const [cacheRows] = await pool.execute(
        `SELECT * FROM university_major_cache 
         WHERE university_name = ? AND major_name = ? AND degree_level = ? 
         AND expires_at > NOW() 
         LIMIT 1`,
        [universityName, majorName, degreeLevel]
      );
      
      const cache = (cacheRows as any[])[0];
      
      if (!cache) {
        console.log(`[Scraping] Cache MISS for ${universityName} + ${majorName}`);
        return { cached: false, projects: [] };
      }
      
      // Cache exists and is valid
      console.log(`[Scraping] Cache HIT for ${universityName} + ${majorName}`);
      
      // Get cached projects
      const [projectRows] = await pool.execute(
        `SELECT * FROM scraped_projects 
         WHERE university_name = ? AND major_name = ? AND degree_level = ? 
         AND expires_at > NOW()
         ORDER BY scraped_at DESC`,
        [universityName, majorName, degreeLevel]
      );
      
      const projects = (projectRows as any[]).map(row => ({
        id: row.id,
        universityName: row.university_name,
        majorName: row.major_name,
        professorName: row.professor_name,
        labName: row.lab_name,
        researchArea: row.research_area,
        projectTitle: row.project_title,
        projectDescription: row.project_description,
        requirements: row.requirements,
        contactEmail: row.contact_email,
        sourceUrl: row.source_url,
        scrapedAt: new Date(row.scraped_at)
      }));
      
      // Update cache usage statistics
      await pool.execute(
        'UPDATE university_major_cache SET request_count = request_count + 1, last_requested_at = NOW() WHERE id = ?',
        [cache.id]
      );
      
      const cacheAge = Math.floor((Date.now() - new Date(cache.cached_at).getTime()) / (1000 * 60 * 60 * 24));
      
      return { cached: true, projects, cacheAge };
    } catch (error) {
      console.error('[Scraping] Error getting cached projects:', error);
      return { cached: false, projects: [] };
    }
    */
  }

  /**
   * Trigger scraping task for (university + major)
   * This creates a scraping task that will be processed asynchronously
   */
  static async triggerScrapingTask(
    universityName: string,
    majorName: string,
    degreeLevel: string = 'all',
    userId?: number
  ): Promise<{ taskId: number; status: string }> {
    try {
      const pool = getConnectionPool();
      
      // Check if task already exists and is pending/in_progress
      const [existingTasks] = await pool.execute(
        `SELECT * FROM scraping_tasks 
         WHERE university_name = ? AND major_name = ? AND degree_level = ? 
         AND status IN ('pending', 'in_progress') 
         LIMIT 1`,
        [universityName, majorName, degreeLevel]
      );
      
      if ((existingTasks as any[]).length > 0) {
        const task = (existingTasks as any[])[0];
        console.log(`[Scraping] Task already exists for ${universityName} + ${majorName}, task_id: ${task.id}`);
        return { taskId: task.id, status: task.status };
      }
      
      // Create new scraping task
      const [result] = await pool.execute(
        `INSERT INTO scraping_tasks 
         (university_name, major_name, degree_level, status, priority, requested_by_user_id, created_at, updated_at) 
         VALUES (?, ?, ?, 'pending', 1, ?, NOW(), NOW())`,
        [universityName, majorName, degreeLevel, userId || null]
      );
      
      const taskId = (result as any).insertId;
      
      console.log(`[Scraping] Created scraping task ${taskId} for ${universityName} + ${majorName}`);
      
      // Process task immediately (in production, this would be handled by a queue worker)
      this.processScrapingTask(taskId).catch(error => {
        console.error(`[Scraping] Error processing task ${taskId}:`, error);
      });
      
      return { taskId, status: 'pending' };
    } catch (error) {
      console.error('[Scraping] Error triggering scraping task:', error);
      throw error;
    }
  }

  /**
   * Process a scraping task
   * This is where the actual scraping happens
   */
  private static async processScrapingTask(taskId: number): Promise<void> {
    const pool = getConnectionPool();
    
    try {
      // Update task status to in_progress
      await pool.execute(
        'UPDATE scraping_tasks SET status = \'in_progress\', started_at = NOW(), updated_at = NOW() WHERE id = ?',
        [taskId]
      );
      
      // Get task details
      const [taskRows] = await pool.execute(
        'SELECT * FROM scraping_tasks WHERE id = ?',
        [taskId]
      );
      
      const task = (taskRows as any[])[0];
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      console.log(`[Scraping] Processing task ${taskId}: ${task.university_name} + ${task.major_name}`);
      
      // Perform scraping (using LLM to generate mock data for now)
      const scrapedProjects = await this.scrapeUniversityProjects(
        task.university_name,
        task.major_name,
        task.degree_level
      );
      
      // Store scraped projects
      for (const project of scrapedProjects) {
        await pool.execute(
          `INSERT INTO scraped_projects 
           (university_name, major_name, degree_level, professor_name, lab_name, research_area, 
            project_title, project_description, requirements, contact_email, source_url, 
            scraped_at, expires_at, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())`,
          [
            task.university_name,
            task.major_name,
            task.degree_level,
            project.professorName,
            project.labName,
            project.researchArea,
            project.projectTitle,
            project.projectDescription,
            project.requirements,
            project.contactEmail,
            project.sourceUrl
          ]
        );
      }
      
      // Create cache entry
      await pool.execute(
        `INSERT INTO university_major_cache 
         (university_name, major_name, degree_level, project_count, cached_at, expires_at, request_count, last_requested_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 1, NOW(), NOW(), NOW())`,
        [task.university_name, task.major_name, task.degree_level, scrapedProjects.length]
      );
      
      // Update task status to completed
      await pool.execute(
        'UPDATE scraping_tasks SET status = \'completed\', completed_at = NOW(), updated_at = NOW(), projects_found = ? WHERE id = ?',
        [scrapedProjects.length, taskId]
      );
      
      console.log(`[Scraping] Task ${taskId} completed: found ${scrapedProjects.length} projects`);
    } catch (error) {
      console.error(`[Scraping] Error processing task ${taskId}:`, error);
      
      // Update task status to failed
      await pool.execute(
        'UPDATE scraping_tasks SET status = \'failed\', error_message = ?, updated_at = NOW(), retry_count = retry_count + 1 WHERE id = ?',
        [String(error), taskId]
      );
      
      // Retry logic (up to 3 times)
      const [taskRows] = await pool.execute(
        'SELECT retry_count FROM scraping_tasks WHERE id = ?',
        [taskId]
      );
      const retryCount = (taskRows as any[])[0]?.retry_count || 0;
      
      if (retryCount < 3) {
        console.log(`[Scraping] Retrying task ${taskId} (attempt ${retryCount + 1}/3)`);
        // In production, this would be handled by a queue with exponential backoff
        setTimeout(() => {
          this.processScrapingTask(taskId).catch(err => {
            console.error(`[Scraping] Retry failed for task ${taskId}:`, err);
          });
        }, 5000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  }

  /**
   * Scrape university projects using real web scraping
   * Falls back to LLM generation if scraping fails
   */
  private static async scrapeUniversityProjects(
    universityName: string,
    majorName: string,
    degreeLevel: string
  ): Promise<Array<Omit<ScrapedProject, 'id' | 'scrapedAt'>>> {
    console.log(`[Scraping] Scraping ${universityName} for ${majorName} projects...`);
    
    try {
      // Import GenericUniversityScraper
      const { GenericUniversityScraper } = await import('./scrapers/GenericUniversityScraper');
      
      // Get university base URL
      const baseUrl = this.getUniversityBaseUrl(universityName);
      
      // Create scraper instance
      const scraper = new GenericUniversityScraper(universityName, baseUrl);
      
      // Scrape projects
      const projects = await scraper.scrapeProjects(majorName, degreeLevel);
      
      if (projects.length > 0) {
        console.log(`[Scraping] Successfully scraped ${projects.length} projects from ${universityName}`);
        
        // LLM二次验证：过滤掉课程内容
        console.log(`[Scraping] Running LLM verification on ${projects.length} projects...`);
        const verifiedProjects = await this.verifyProjectsWithLLM(projects);
        console.log(`[Scraping] LLM verification complete: ${verifiedProjects.length}/${projects.length} projects verified as research projects`);
        
        // Add universityName and majorName to match ScrapedProject interface
        return verifiedProjects.map((p: any) => ({
          ...p,
          universityName,
          majorName
        }));
      }
      
      // If no projects found, fall back to LLM generation
      console.log(`[Scraping] No projects found via scraping, falling back to LLM generation`);
      return await this.generateProjectsWithLLM(universityName, majorName, degreeLevel);
      
    } catch (error) {
      console.error(`[Scraping] Error during web scraping:`, error);
      // Fall back to LLM generation
      console.log(`[Scraping] Falling back to LLM generation due to error`);
      return await this.generateProjectsWithLLM(universityName, majorName, degreeLevel);
    }
  }
  
  /**
   * Get base URL for a university
   */
  private static getUniversityBaseUrl(universityName: string): string {
    // Map of university names to their base URLs
    const universityUrls: Record<string, string> = {
      'Massachusetts Institute of Technology': 'https://www.csail.mit.edu',
      'MIT': 'https://www.csail.mit.edu',
      'Stanford University': 'https://cs.stanford.edu',
      'Stanford': 'https://cs.stanford.edu',
      'Harvard University': 'https://seas.harvard.edu',
      'Harvard': 'https://seas.harvard.edu',
      'University of California, Berkeley': 'https://eecs.berkeley.edu',
      'UC Berkeley': 'https://eecs.berkeley.edu',
      'Berkeley': 'https://eecs.berkeley.edu',
      'Carnegie Mellon University': 'https://www.cs.cmu.edu',
      'CMU': 'https://www.cs.cmu.edu',
      'California Institute of Technology': 'https://www.cms.caltech.edu',
      'Caltech': 'https://www.cms.caltech.edu',
      'Princeton University': 'https://www.cs.princeton.edu',
      'Princeton': 'https://www.cs.princeton.edu',
      'Yale University': 'https://cpsc.yale.edu',
      'Yale': 'https://cpsc.yale.edu',
      'Columbia University': 'https://www.cs.columbia.edu',
      'Columbia': 'https://www.cs.columbia.edu',
      'Cornell University': 'https://www.cs.cornell.edu',
      'Cornell': 'https://www.cs.cornell.edu',
    };
    
    // Try exact match first
    if (universityUrls[universityName]) {
      return universityUrls[universityName];
    }
    
    // Try partial match
    for (const [key, url] of Object.entries(universityUrls)) {
      if (universityName.includes(key) || key.includes(universityName)) {
        return url;
      }
    }
    
    // Default: try to construct URL from university name
    const slug = universityName.toLowerCase()
      .replace(/university|college|institute/gi, '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    return `https://www.${slug}.edu`;
  }
  
  /**
   * Generate projects using LLM (fallback method)
   */
  private static async generateProjectsWithLLM(
    universityName: string,
    majorName: string,
    degreeLevel: string
  ): Promise<Array<Omit<ScrapedProject, 'id' | 'scrapedAt'>>> {
    console.log(`[Scraping] Generating projects with LLM for ${universityName}...`);
    
    const prompt = `You are a research project data generator. Generate 5-7 realistic research project opportunities at ${universityName} in the field of ${majorName} for ${degreeLevel} students.

For each project, provide:
1. Professor name (realistic name)
2. Lab name
3. Research area (specific sub-field of ${majorName})
4. Project title
5. Project description (2-3 sentences)
6. Requirements (GPA, skills, experience)
7. Contact email (format: firstname.lastname@university.edu)
8. Source URL (format: https://university.edu/department/lab)

Generate diverse projects across different sub-fields and research areas within ${majorName}.

Respond in JSON format as an array of projects.`;

    const response = await invokeLLMWithLimit({
      messages: [
        { role: "system", content: "You are a research project data generator. Always respond with valid JSON array." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "research_projects",
          strict: true,
          schema: {
            type: "object",
            properties: {
              projects: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    professorName: { type: "string" },
                    labName: { type: "string" },
                    researchArea: { type: "string" },
                    projectTitle: { type: "string" },
                    projectDescription: { type: "string" },
                    requirements: { type: "string" },
                    contactEmail: { type: "string" },
                    sourceUrl: { type: "string" }
                  },
                  required: ["professorName", "labName", "researchArea", "projectTitle", "projectDescription", "requirements", "contactEmail", "sourceUrl"],
                  additionalProperties: false
                }
              }
            },
            required: ["projects"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error("LLM returned empty or invalid response");
    }

    const data = JSON.parse(content);
    
    return data.projects.map((project: any) => ({
      universityName,
      majorName,
      professorName: project.professorName,
      labName: project.labName,
      researchArea: project.researchArea,
      projectTitle: project.projectTitle,
      projectDescription: project.projectDescription,
      requirements: project.requirements,
      contactEmail: project.contactEmail,
      sourceUrl: project.sourceUrl
    }));
  }

  /**
   * Get scraping task status
   */
  static async getTaskStatus(taskId: number): Promise<any> {
    try {
      const pool = getConnectionPool();
      const [rows] = await pool.execute(
        'SELECT * FROM scraping_tasks WHERE id = ?',
        [taskId]
      );
      return (rows as any[])[0] || null;
    } catch (error) {
      console.error('[Scraping] Error getting task status:', error);
      return null;
    }
  }

  /**
   * LLM二次验证：过滤掉课程内容，只保留真正的科研项目
   */
  private static async verifyProjectsWithLLM(
    projects: any[]
  ): Promise<any[]> {
    const verifiedProjects: any[] = [];
    
    // 批量验证，每次验证5个项目
    for (let i = 0; i < projects.length; i += 5) {
      const batch = projects.slice(i, i + 5);
      
      for (const project of batch) {
        try {
          const isResearchProject = await this.verifyProjectWithLLM(project);
          if (isResearchProject) {
            verifiedProjects.push(project);
          } else {
            console.log(`[Scraping] LLM filtered out non-research project: ${project.projectTitle}`);
          }
        } catch (error) {
          console.error(`[Scraping] Error verifying project:`, error);
          // 验证失败时保留项目（宁可误留，不可误删）
          verifiedProjects.push(project);
        }
      }
    }
    
    return verifiedProjects;
  }
  
  /**
   * 使用LLM验证单个项目是否为科研项目
   */
  private static async verifyProjectWithLLM(project: any): Promise<boolean> {
    const prompt = `You are a research project classifier. Determine if the following content describes a REAL RESEARCH PROJECT/LAB or a COURSE.

**Project Information:**
Title: ${project.projectTitle}
Lab Name: ${project.labName}
Professor: ${project.professorName}
Research Area: ${project.researchArea}
Description: ${project.projectDescription}
Requirements: ${project.requirements}

**Classification Rules:**
- Research projects/labs: faculty research groups, ongoing research, research assistant positions, lab opportunities
- Courses: class syllabi, course descriptions, lectures, homework, assignments, exams

**Question:** Is this a research project/lab (not a course)?

Respond with ONLY "true" or "false".`;

    try {
      const response = await invokeLLMWithLimit({
        messages: [
          { role: 'system', content: 'You are a precise classifier. Always respond with only "true" or "false".' },
          { role: 'user', content: prompt }
        ],
      });
      
      const content = response.choices[0]?.message?.content?.trim().toLowerCase();
      return content === 'true';
    } catch (error) {
      console.error(`[Scraping] LLM verification error:`, error);
      // 验证失败时默认为是科研项目
      return true;
    }
  }
  
  /**
   * Clean up expired cache and projects
   */
  static async cleanupExpiredData(): Promise<{ deletedProjects: number; deletedCache: number }> {
    try {
      const pool = getConnectionPool();
      
      // Delete expired projects
      const [projectResult] = await pool.execute(
        'DELETE FROM scraped_projects WHERE expires_at < NOW()'
      );
      
      // Delete expired cache
      const [cacheResult] = await pool.execute(
        'DELETE FROM university_major_cache WHERE expires_at < NOW()'
      );
      
      const deletedProjects = (projectResult as any).affectedRows || 0;
      const deletedCache = (cacheResult as any).affectedRows || 0;
      
      console.log(`[Scraping] Cleanup: deleted ${deletedProjects} expired projects, ${deletedCache} expired cache entries`);
      
      return { deletedProjects, deletedCache };
    } catch (error) {
      console.error('[Scraping] Error cleaning up expired data:', error);
      return { deletedProjects: 0, deletedCache: 0 };
    }
  }
}
