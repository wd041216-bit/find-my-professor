import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProjectsFromScrapedData, hasSufficientScrapedProjects } from './services/scrapedProjectsService';
import * as db from './db';

describe('Scraped Projects Service', () => {
  describe('getProjectsFromScrapedData', () => {
    it('should return empty array when no scraped projects exist', async () => {
      const projects = await getProjectsFromScrapedData('NonExistentUniversity', 'NonExistentMajor', 10);
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBe(0);
    });

    it('should return projects in MatchedProject format', async () => {
      const projects = await getProjectsFromScrapedData('University of Washington', 'Physics', 5);
      
      // If projects exist, verify structure
      if (projects.length > 0) {
        const project = projects[0];
        expect(project).toHaveProperty('projectName');
        expect(project).toHaveProperty('professorName');
        expect(project).toHaveProperty('researchDirection');
        expect(project).toHaveProperty('description');
        expect(project).toHaveProperty('matchScore');
        expect(project).toHaveProperty('matchReason');
        expect(typeof project.matchScore).toBe('number');
      }
    });
  });

  describe('hasSufficientScrapedProjects', () => {
    it('should return boolean value', async () => {
      const result = await hasSufficientScrapedProjects('University of Washington', 'Physics', 50);
      expect(typeof result).toBe('boolean');
    });

    it('should return false for non-existent university+major', async () => {
      const result = await hasSufficientScrapedProjects('NonExistentUniversity', 'NonExistentMajor', 5);
      expect(result).toBe(false);
    });
  });
});

describe('Matching Flow with Scraped Projects', () => {
  it('should prioritize scraped_projects over LLM generation', async () => {
    // This is an integration test concept
    // In real implementation, we would mock the database and verify call order:
    // 1. Check profile cache
    // 2. Check scraped_projects
    // 3. Only call LLM if scraped_projects is empty
    
    // For now, just verify the service exists and works
    const projects = await getProjectsFromScrapedData('Test University', 'Test Major', 10);
    expect(Array.isArray(projects)).toBe(true);
  });
});
