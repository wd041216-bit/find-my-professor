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
   */
  static async getCachedProjects(
    universityName: string,
    majorName: string,
    degreeLevel: string = 'all'
  ): Promise<{ cached: boolean; projects: ScrapedProject[]; cacheAge?: number }> {
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
   * Scrape university projects (using LLM to generate realistic data)
   * In production, this would use actual web scraping or API calls
   */
  private static async scrapeUniversityProjects(
    universityName: string,
    majorName: string,
    degreeLevel: string
  ): Promise<Array<Omit<ScrapedProject, 'id' | 'scrapedAt'>>> {
    console.log(`[Scraping] Scraping ${universityName} for ${majorName} projects...`);
    
    // Use LLM to generate realistic research project data
    const prompt = `You are a research project data generator. Generate 5-10 realistic research project opportunities at ${universityName} in the field of ${majorName} for ${degreeLevel} students.

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
