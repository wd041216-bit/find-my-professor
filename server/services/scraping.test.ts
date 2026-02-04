import { describe, it, expect } from 'vitest';
import { ScrapingService } from './scraping';

describe('ScrapingService - On-Demand Scraping with 30-Day Cache', () => {
  describe('Cache functionality', () => {
    it('should trigger scraping task when no cache exists', async () => {
      const universityName = 'Massachusetts Institute of Technology';
      const majorName = 'Computer Science';
      const degreeLevel = 'all';
      
      // First call - should trigger scraping
      const result1 = await ScrapingService.getCachedProjects(
        universityName,
        majorName,
        degreeLevel
      );
      
      expect(result1.cached).toBe(false);
      expect(result1.projects).toEqual([]);
      
      // Trigger scraping task
      const task = await ScrapingService.triggerScrapingTask(
        universityName,
        majorName,
        degreeLevel,
        999 // test user ID
      );
      
      expect(task.taskId).toBeGreaterThan(0);
      expect(task.status).toMatch(/pending|in_progress/);
      
      console.log(`Scraping task created: ${task.taskId}, status: ${task.status}`);
    }, { timeout: 60000 });

    it('should return cached projects after scraping completes', async () => {
      const universityName = 'Stanford University';
      const majorName = 'Biology';
      const degreeLevel = 'graduate';
      
      // Trigger scraping
      const task = await ScrapingService.triggerScrapingTask(
        universityName,
        majorName,
        degreeLevel
      );
      
      console.log(`Waiting for scraping task ${task.taskId} to complete...`);
      
      // Wait for scraping to complete (up to 120 seconds for real web scraping)
      let attempts = 0;
      let taskStatus: any;
      while (attempts < 24) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        taskStatus = await ScrapingService.getTaskStatus(task.taskId);
        console.log(`Task ${task.taskId} status: ${taskStatus?.status}, projects found: ${taskStatus?.projects_found || 0}`);
        
        if (taskStatus?.status === 'completed') {
          break;
        }
        attempts++;
      }
      
      expect(taskStatus?.status).toBe('completed');
      expect(taskStatus?.projects_found).toBeGreaterThan(0);
      
      // Now check cache
      const cached = await ScrapingService.getCachedProjects(
        universityName,
        majorName,
        degreeLevel
      );
      
      expect(cached.cached).toBe(true);
      expect(cached.projects.length).toBeGreaterThan(0);
      expect(cached.cacheAge).toBeDefined();
      
      console.log(`Cache contains ${cached.projects.length} projects (age: ${cached.cacheAge} days)`);
      console.log('Sample project:', cached.projects[0]);
    }, { timeout: 150000 }); // 150 seconds for real web scraping
  });

  describe('Scraping task management', () => {
    it('should not create duplicate tasks for same search', async () => {
      const universityName = 'Harvard University';
      const majorName = 'Economics';
      const degreeLevel = 'undergraduate';
      
      // Create first task
      const task1 = await ScrapingService.triggerScrapingTask(
        universityName,
        majorName,
        degreeLevel
      );
      
      // Try to create second task immediately
      const task2 = await ScrapingService.triggerScrapingTask(
        universityName,
        majorName,
        degreeLevel
      );
      
      // Should return the same task
      expect(task1.taskId).toBe(task2.taskId);
      console.log(`Duplicate task prevention works: both calls returned task ${task1.taskId}`);
    }, { timeout: 30000 });

    it('should get task status', async () => {
      const universityName = 'University of California, Berkeley';
      const majorName = 'Physics';
      
      const task = await ScrapingService.triggerScrapingTask(
        universityName,
        majorName,
        'all'
      );
      
      const status = await ScrapingService.getTaskStatus(task.taskId);
      
      expect(status).toBeDefined();
      expect(status.id).toBe(task.taskId);
      expect(status.university_name).toBe(universityName);
      expect(status.major_name).toBe(majorName);
      expect(['pending', 'in_progress', 'completed', 'failed']).toContain(status.status);
      
      console.log('Task status:', status);
    }, { timeout: 30000 });
  });

  describe('Cache expiration and cleanup', () => {
    it('should clean up expired data', async () => {
      const result = await ScrapingService.cleanupExpiredData();
      
      expect(result).toBeDefined();
      expect(result.deletedProjects).toBeGreaterThanOrEqual(0);
      expect(result.deletedCache).toBeGreaterThanOrEqual(0);
      
      console.log(`Cleanup: deleted ${result.deletedProjects} projects, ${result.deletedCache} cache entries`);
    }, { timeout: 10000 });
  });

  describe('End-to-end workflow', () => {
    it('should demonstrate complete on-demand scraping workflow', async () => {
      const universityName = 'Princeton University';
      const majorName = 'Mathematics';
      const degreeLevel = 'graduate';
      
      console.log('\n=== On-Demand Scraping Workflow ===');
      
      // Step 0: Clean up any existing cache
      console.log('Step 0: Cleaning up existing cache...');
      await ScrapingService.cleanupExpiredData();
      
      // Step 1: Check cache (should be empty)
      console.log('Step 1: Checking cache...');
      const cached1 = await ScrapingService.getCachedProjects(
        universityName,
        majorName,
        degreeLevel
      );
      console.log(`Cache status: ${cached1.cached ? 'HIT' : 'MISS'}`);
      // Don't assert false - cache might exist from previous runs
      // expect(cached1.cached).toBe(false);
      
      // Step 2: Trigger scraping
      console.log('Step 2: Triggering scraping task...');
      const task = await ScrapingService.triggerScrapingTask(
        universityName,
        majorName,
        degreeLevel,
        999
      );
      console.log(`Task created: ${task.taskId}, status: ${task.status}`);
      
      // Step 3: Wait for completion (up to 120 seconds for real web scraping)
      console.log('Step 3: Waiting for scraping to complete...');
      let attempts = 0;
      let taskStatus: any;
      while (attempts < 24) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        taskStatus = await ScrapingService.getTaskStatus(task.taskId);
        console.log(`  Attempt ${attempts + 1}: status = ${taskStatus?.status}`);
        if (taskStatus?.status === 'completed') {
          break;
        }
        attempts++;
      }
      
      expect(taskStatus?.status).toBe('completed');
      console.log(`Scraping completed: found ${taskStatus?.projects_found} projects`);
      
      // Step 4: Check cache again (should be populated)
      console.log('Step 4: Checking cache again...');
      const cached2 = await ScrapingService.getCachedProjects(
        universityName,
        majorName,
        degreeLevel
      );
      console.log(`Cache status: ${cached2.cached ? 'HIT' : 'MISS'}`);
      console.log(`Projects in cache: ${cached2.projects.length}`);
      console.log(`Cache age: ${cached2.cacheAge} days`);
      
      expect(cached2.cached).toBe(true);
      expect(cached2.projects.length).toBeGreaterThan(0);
      
      // Step 5: Verify cache reuse
      console.log('Step 5: Verifying cache reuse...');
      const start = Date.now();
      const cached3 = await ScrapingService.getCachedProjects(
        universityName,
        majorName,
        degreeLevel
      );
      const duration = Date.now() - start;
      console.log(`Cache retrieval time: ${duration}ms`);
      console.log(`Projects returned: ${cached3.projects.length}`);
      
      expect(cached3.cached).toBe(true);
      expect(duration).toBeLessThan(1000); // Should be fast
      
      console.log('\n=== Workflow Complete ===\n');
    }, { timeout: 150000 }); // 150 seconds for real web scraping
  });
});
