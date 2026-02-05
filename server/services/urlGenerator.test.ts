import { describe, it, expect, beforeAll } from 'vitest';
import { UrlGeneratorService } from './urlGenerator';

describe('UrlGeneratorService', () => {
  
  describe('generateUniversityUrl', () => {
    it('should generate URL for a known university', async () => {
      const result = await UrlGeneratorService.generateUniversityUrl(
        'University of Washington',
        'computer science'
      );
      
      expect(result).toBeDefined();
      expect(result.url).toContain('washington.edu');
      expect(result.confidence).toMatch(/high|medium|low/);
      expect(Array.isArray(result.alternatives)).toBe(true);
    }, 30000); // 30s timeout for LLM call
    
    it('should generate URL for a less common university', async () => {
      const result = await UrlGeneratorService.generateUniversityUrl(
        'Arizona State University',
        'computer science'
      );
      
      expect(result).toBeDefined();
      expect(result.url).toContain('asu.edu');
      expect(result.alternatives.length).toBeGreaterThan(0);
    }, 30000);
  });
  
  describe('testUrlAccessible', () => {
    it('should return true for accessible URL', async () => {
      const isAccessible = await UrlGeneratorService.testUrlAccessible(
        'https://www.cs.washington.edu'
      );
      
      expect(isAccessible).toBe(true);
    }, 10000);
    
    it('should return false for non-existent URL', async () => {
      const isAccessible = await UrlGeneratorService.testUrlAccessible(
        'https://www.thisdoesnotexist12345.edu'
      );
      
      expect(isAccessible).toBe(false);
    }, 10000);
  });
  
  describe('URL caching', () => {
    it('should cache and retrieve URL', async () => {
      const testUrl = 'https://test.cs.example.edu';
      const testUniversity = 'Test University ' + Date.now();
      
      // Cache URL
      await UrlGeneratorService.cacheUrl(
        testUniversity,
        'computer science',
        testUrl,
        'manual',
        'high',
        true
      );
      
      // Retrieve from cache
      const cachedUrl = await UrlGeneratorService.getCachedUrl(
        testUniversity,
        'computer science'
      );
      
      expect(cachedUrl).toBe(testUrl);
    });
    
    it('should return null for non-cached university', async () => {
      const cachedUrl = await UrlGeneratorService.getCachedUrl(
        'Non Existent University ' + Date.now(),
        'computer science'
      );
      
      expect(cachedUrl).toBeNull();
    });
  });
  
  describe('generateAndValidateUrl', () => {
    it('should generate and validate URL for University of Washington', async () => {
      const url = await UrlGeneratorService.generateAndValidateUrl(
        'University of Washington',
        'computer science'
      );
      
      expect(url).toBeDefined();
      expect(url).toContain('washington.edu');
    }, 60000); // 60s timeout for LLM + validation
  });
});
