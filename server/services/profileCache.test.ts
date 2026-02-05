import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateProfileHash, getCachedMatches, cacheMatches, getCacheStats, cleanExpiredCaches } from './profileCache';
import type { MatchedProject } from './llmMatching';

describe('Profile Cache Service', () => {
  const testUniversity = 'Stanford University';
  const testMajor = 'Computer Science';
  const testAcademicLevel = 'undergraduate';
  
  const mockMatches: MatchedProject[] = [
    {
      projectName: 'AI Research Project',
      professorName: 'Dr. John Smith',
      lab: 'AI Lab',
      researchDirection: 'Machine Learning',
      description: 'Research on deep learning',
      requirements: 'Python, TensorFlow',
      contactEmail: 'smith@stanford.edu',
      url: 'https://ai.stanford.edu/project1',
      matchScore: 85,
      matchReason: 'Strong match based on your skills',
    },
    {
      projectName: 'Computer Vision Project',
      professorName: 'Dr. Jane Doe',
      researchDirection: 'Computer Vision',
      description: 'Research on image recognition',
      matchScore: 78,
      matchReason: 'Good match for your interests',
    },
  ];

  describe('generateProfileHash', () => {
    it('should generate consistent hash for same profile', () => {
      const hash1 = generateProfileHash({
        university: testUniversity,
        major: testMajor,
        academicLevel: testAcademicLevel,
        hasSkills: true,
        hasActivities: true,
      });
      
      const hash2 = generateProfileHash({
        university: testUniversity,
        major: testMajor,
        academicLevel: testAcademicLevel,
        hasSkills: true,
        hasActivities: true,
      });
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should generate different hash for different profiles', () => {
      const hash1 = generateProfileHash({
        university: testUniversity,
        major: testMajor,
        academicLevel: testAcademicLevel,
        hasSkills: true,
        hasActivities: true,
      });
      
      const hash2 = generateProfileHash({
        university: testUniversity,
        major: testMajor,
        academicLevel: testAcademicLevel,
        hasSkills: false, // Different
        hasActivities: true,
      });
      
      expect(hash1).not.toBe(hash2);
    });

    it('should be case-insensitive for university and major', () => {
      const hash1 = generateProfileHash({
        university: 'Stanford University',
        major: 'Computer Science',
        academicLevel: testAcademicLevel,
        hasSkills: true,
        hasActivities: true,
      });
      
      const hash2 = generateProfileHash({
        university: 'stanford university', // Lowercase
        major: 'computer science', // Lowercase
        academicLevel: testAcademicLevel,
        hasSkills: true,
        hasActivities: true,
      });
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('Cache Operations', () => {
    it('should return null for cache miss', async () => {
      const cached = await getCachedMatches(
        'Nonexistent University',
        'Nonexistent Major',
        testAcademicLevel,
        true,
        true
      );
      
      expect(cached).toBeNull();
    });

    it('should store and retrieve cached matches', async () => {
      // Store matches
      await cacheMatches(
        testUniversity,
        testMajor,
        testAcademicLevel,
        true,
        true,
        mockMatches
      );
      
      // Retrieve matches
      const cached = await getCachedMatches(
        testUniversity,
        testMajor,
        testAcademicLevel,
        true,
        true
      );
      
      expect(cached).not.toBeNull();
      expect(cached).toHaveLength(mockMatches.length);
      expect(cached![0].projectName).toBe(mockMatches[0].projectName);
      expect(cached![0].professorName).toBe(mockMatches[0].professorName);
    });

    it('should increment hit count on cache reuse', async () => {
      // First retrieval
      const cached1 = await getCachedMatches(
        testUniversity,
        testMajor,
        testAcademicLevel,
        true,
        true
      );
      expect(cached1).not.toBeNull();
      
      // Second retrieval
      const cached2 = await getCachedMatches(
        testUniversity,
        testMajor,
        testAcademicLevel,
        true,
        true
      );
      expect(cached2).not.toBeNull();
      
      // Check stats
      const stats = await getCacheStats();
      expect(stats.totalHits).toBeGreaterThan(0);
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', async () => {
      const stats = await getCacheStats();
      
      expect(stats).toHaveProperty('totalCaches');
      expect(stats).toHaveProperty('totalHits');
      expect(stats).toHaveProperty('averageHitsPerCache');
      expect(stats.totalCaches).toBeGreaterThanOrEqual(0);
      expect(stats.totalHits).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cache Cleanup', () => {
    it('should clean expired caches', async () => {
      const result = await cleanExpiredCaches();
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
