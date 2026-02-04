import { describe, it, expect } from 'vitest';
import { NormalizationService } from './normalization';

describe('NormalizationService', () => {
  describe('normalizeUniversity', () => {
    it('should normalize university abbreviations', async () => {
      const result = await NormalizationService.normalizeUniversity('MIT');
      
      expect(result.normalizedName).toContain('Massachusetts Institute of Technology');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.aliases).toContain('MIT');
    }, { timeout: 30000 }); // LLM calls can take time

    it('should normalize informal university names', async () => {
      const result = await NormalizationService.normalizeUniversity('UC Berkeley');
      
      expect(result.normalizedName).toContain('University of California');
      expect(result.normalizedName).toContain('Berkeley');
      expect(result.confidence).toBeGreaterThan(0.8);
    }, { timeout: 30000 });

    it('should handle Chinese university names', async () => {
      const result = await NormalizationService.normalizeUniversity('清华大学');
      
      expect(result.normalizedName).toContain('Tsinghua');
      expect(result.country).toBe('China');
      expect(result.confidence).toBeGreaterThan(0.8);
    }, { timeout: 30000 });
  });

  describe('normalizeMajor', () => {
    it('should normalize major abbreviations', async () => {
      const result = await NormalizationService.normalizeMajor('CS');
      
      expect(result.normalizedName).toContain('Computer Science');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.aliases).toContain('CS');
      expect(result.category).toBe('STEM');
    }, { timeout: 30000 });

    it('should normalize informal major names', async () => {
      const result = await NormalizationService.normalizeMajor('Bio');
      
      expect(result.normalizedName).toContain('Biology');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.category).toBe('STEM');
    }, { timeout: 30000 });

    it('should identify related majors', async () => {
      const result = await NormalizationService.normalizeMajor('Computer Science');
      
      expect(result.relatedMajors.length).toBeGreaterThan(0);
      expect(result.relatedMajors.some(m => 
        m.toLowerCase().includes('software') || 
        m.toLowerCase().includes('artificial intelligence') ||
        m.toLowerCase().includes('data science')
      )).toBe(true);
    }, { timeout: 30000 });
  });

  describe('batch normalization', () => {
    it('should normalize multiple universities', async () => {
      const results = await NormalizationService.normalizeUniversities(['MIT', 'Stanford', 'Harvard']);
      
      expect(results).toHaveLength(3);
      expect(results[0].normalizedName).toContain('Massachusetts Institute of Technology');
      expect(results[1].normalizedName).toContain('Stanford');
      expect(results[2].normalizedName).toContain('Harvard');
    }, { timeout: 60000 });

    it('should normalize multiple majors', async () => {
      const results = await NormalizationService.normalizeMajors(['CS', 'Bio', 'Econ']);
      
      expect(results).toHaveLength(3);
      expect(results[0].normalizedName).toContain('Computer Science');
      expect(results[1].normalizedName).toContain('Biology');
      expect(results[2].normalizedName).toContain('Economics');
    }, { timeout: 60000 });
  });
});
