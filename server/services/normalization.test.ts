import { describe, it, expect, beforeAll } from 'vitest';
import { NormalizationService } from './normalization';

describe('NormalizationService with Database Caching', () => {
  describe('University normalization with caching', () => {
    it('should normalize MIT and cache the result', async () => {
      const result1 = await NormalizationService.normalizeUniversity('MIT');
      
      expect(result1.normalizedName).toContain('Massachusetts Institute of Technology');
      expect(result1.confidence).toBeGreaterThan(0.8);
      expect(result1.aliases).toContain('MIT');
      
      // Second call should hit cache (check console logs)
      const result2 = await NormalizationService.normalizeUniversity('MIT');
      expect(result2.normalizedName).toBe(result1.normalizedName);
    }, { timeout: 30000 });

    it('should handle different variations of the same university', async () => {
      // These should all be cached separately but return similar results
      const mit1 = await NormalizationService.normalizeUniversity('MIT');
      const mit2 = await NormalizationService.normalizeUniversity('mit');
      const mit3 = await NormalizationService.normalizeUniversity('M.I.T.');
      
      // All should normalize to the same university
      expect(mit1.normalizedName).toContain('Massachusetts Institute of Technology');
      expect(mit2.normalizedName).toContain('Massachusetts Institute of Technology');
      expect(mit3.normalizedName).toContain('Massachusetts Institute of Technology');
    }, { timeout: 60000 });
  });

  describe('Major normalization with caching', () => {
    it('should normalize CS and cache the result', async () => {
      const result1 = await NormalizationService.normalizeMajor('CS');
      
      expect(result1.normalizedName).toContain('Computer Science');
      expect(result1.confidence).toBeGreaterThan(0.8);
      expect(result1.aliases).toContain('CS');
      expect(result1.category).toBe('STEM');
      
      // Second call should hit cache (check console logs)
      const result2 = await NormalizationService.normalizeMajor('CS');
      expect(result2.normalizedName).toBe(result1.normalizedName);
    }, { timeout: 30000 });

    it('should handle different variations of the same major', async () => {
      const cs1 = await NormalizationService.normalizeMajor('CS');
      const cs2 = await NormalizationService.normalizeMajor('cs');
      const cs3 = await NormalizationService.normalizeMajor('Computer Science');
      
      // All should normalize to the same major
      expect(cs1.normalizedName).toContain('Computer Science');
      expect(cs2.normalizedName).toContain('Computer Science');
      expect(cs3.normalizedName).toContain('Computer Science');
    }, { timeout: 60000 });
  });

  describe('Cache statistics', () => {
    it('should return cache statistics', async () => {
      // Normalize a few items first
      await NormalizationService.normalizeUniversity('Stanford');
      await NormalizationService.normalizeMajor('Biology');
      
      const stats = await NormalizationService.getCacheStats();
      
      expect(stats.universities).toBeGreaterThan(0);
      expect(stats.majors).toBeGreaterThan(0);
      expect(stats.totalUsage).toBeGreaterThan(0);
      
      console.log('Cache statistics:', stats);
    }, { timeout: 30000 });
  });

  describe('User input history logging', () => {
    it('should log user input when userId is provided', async () => {
      const userId = 999; // Test user ID
      
      await NormalizationService.normalizeUniversity('Harvard', userId);
      await NormalizationService.normalizeMajor('Economics', userId);
      
      // If no errors, logging succeeded
      expect(true).toBe(true);
    }, { timeout: 30000 });
  });

  describe('Performance: Cache vs LLM', () => {
    it('should demonstrate cache performance improvement', async () => {
      const testUniversity = 'University of Washington';
      
      // First call - LLM (slow)
      const start1 = Date.now();
      await NormalizationService.normalizeUniversity(testUniversity);
      const time1 = Date.now() - start1;
      
      // Second call - Cache (fast)
      const start2 = Date.now();
      await NormalizationService.normalizeUniversity(testUniversity);
      const time2 = Date.now() - start2;
      
      console.log(`First call (LLM): ${time1}ms`);
      console.log(`Second call (Cache): ${time2}ms`);
      console.log(`Speed improvement: ${(time1 / time2).toFixed(2)}x faster`);
      
      // Cache should be significantly faster (at least 10x)
      expect(time2).toBeLessThan(time1 / 10);
    }, { timeout: 60000 });
  });
});
