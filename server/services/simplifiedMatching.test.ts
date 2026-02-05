import { describe, it, expect } from 'vitest';
import { isSimplifiedProfile, getRandomProjectsFromDatabase, hasSufficientProjects } from './simplifiedMatching';

describe('Simplified Matching Service', () => {
  describe('isSimplifiedProfile', () => {
    it('should return true for profile with only required fields', () => {
      const result = isSimplifiedProfile(
        undefined, // no skills
        undefined, // no interests
        [], // no activities
        undefined // no bio
      );
      
      expect(result).toBe(true);
    });

    it('should return false for profile with skills', () => {
      const result = isSimplifiedProfile(
        ['Python', 'JavaScript'], // has skills
        undefined,
        [],
        undefined
      );
      
      expect(result).toBe(false);
    });

    it('should return false for profile with interests', () => {
      const result = isSimplifiedProfile(
        undefined,
        ['Machine Learning', 'AI'], // has interests
        [],
        undefined
      );
      
      expect(result).toBe(false);
    });

    it('should return false for profile with activities', () => {
      const result = isSimplifiedProfile(
        undefined,
        undefined,
        [{ title: 'Research Project', category: 'research' }], // has activities
        undefined
      );
      
      expect(result).toBe(false);
    });

    it('should return false for profile with bio', () => {
      const result = isSimplifiedProfile(
        undefined,
        undefined,
        [],
        'I am a passionate student interested in research' // has bio
      );
      
      expect(result).toBe(false);
    });

    it('should return false for profile with multiple fields', () => {
      const result = isSimplifiedProfile(
        ['Python'],
        ['AI'],
        [{ title: 'Project', category: 'research' }],
        'Bio text'
      );
      
      expect(result).toBe(false);
    });

    it('should handle empty arrays correctly', () => {
      const result = isSimplifiedProfile(
        [], // empty array = no skills
        [],
        [],
        ''
      );
      
      expect(result).toBe(true);
    });
  });

  describe('Database Operations', () => {
    const testUniversity = 'Stanford University';
    const testMajor = 'Computer Science';

    it('should check if database has sufficient projects', async () => {
      const result = await hasSufficientProjects(testUniversity, testMajor, 5);
      
      // Result depends on database state
      expect(typeof result).toBe('boolean');
    });

    it('should get random projects from database', async () => {
      const projects = await getRandomProjectsFromDatabase(testUniversity, testMajor, 10);
      
      // Result depends on database state
      expect(Array.isArray(projects)).toBe(true);
      
      // If projects exist, verify structure
      if (projects.length > 0) {
        const project = projects[0];
        expect(project).toHaveProperty('projectName');
        expect(project).toHaveProperty('professorName');
        expect(project).toHaveProperty('researchDirection');
        expect(project).toHaveProperty('description');
        expect(project).toHaveProperty('matchScore');
        expect(project).toHaveProperty('matchReason');
        
        // Verify match score is in expected range (70-90)
        expect(project.matchScore).toBeGreaterThanOrEqual(70);
        expect(project.matchScore).toBeLessThanOrEqual(90);
      }
    });

    it('should return empty array for nonexistent university/major', async () => {
      const projects = await getRandomProjectsFromDatabase(
        'Nonexistent University',
        'Nonexistent Major',
        10
      );
      
      expect(projects).toEqual([]);
    });

    it('should respect count parameter', async () => {
      const count = 5;
      const projects = await getRandomProjectsFromDatabase(testUniversity, testMajor, count);
      
      // Should return at most 'count' projects
      expect(projects.length).toBeLessThanOrEqual(count);
    });
  });
});
