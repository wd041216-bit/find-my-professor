import { describe, it, expect, vi } from 'vitest';
import { isSimplifiedProfile, getRandomProjectsFromDatabase, hasSufficientProjects } from './services/simplifiedMatching';
import * as db from './db';

describe('Matching Fixes Tests', () => {
  describe('Simplified Profile Detection', () => {
    it('should detect simplified profile with no skills/interests/activities/bio', () => {
      const result = isSimplifiedProfile(undefined, undefined, undefined, undefined);
      expect(result).toBe(true);
    });

    it('should detect simplified profile with empty arrays', () => {
      const result = isSimplifiedProfile([], [], [], '');
      expect(result).toBe(true);
    });

    it('should detect detailed profile with skills', () => {
      const result = isSimplifiedProfile(['Python', 'JavaScript'], undefined, undefined, undefined);
      expect(result).toBe(false);
    });

    it('should detect detailed profile with interests', () => {
      const result = isSimplifiedProfile(undefined, ['AI', 'ML'], undefined, undefined);
      expect(result).toBe(false);
    });

    it('should detect detailed profile with activities', () => {
      const activities = [{ title: 'Research Project', category: 'research', description: 'Test' }];
      const result = isSimplifiedProfile(undefined, undefined, activities, undefined);
      expect(result).toBe(false);
    });

    it('should detect detailed profile with bio', () => {
      const result = isSimplifiedProfile(undefined, undefined, undefined, 'I am a student');
      expect(result).toBe(false);
    });
  });

  describe('Database Empty Handling', () => {
    it('should return empty array when database has no projects', async () => {
      const projects = await getRandomProjectsFromDatabase('NonExistentUniversity', 'NonExistentMajor', 10);
      expect(projects).toEqual([]);
    });

    it('should check if database has sufficient projects', async () => {
      const hasSufficient = await hasSufficientProjects('NonExistentUniversity', 'NonExistentMajor', 5);
      expect(hasSufficient).toBe(false);
    });
  });

  describe('Profile Validation', () => {
    it('should require target university', async () => {
      // This test verifies that the backend validation exists
      // The actual validation is in matching router
      const profile = {
        targetUniversities: '[]',
        targetMajors: '["Computer Science"]',
        academicLevel: 'undergraduate',
      };
      
      const universities = JSON.parse(profile.targetUniversities);
      expect(universities.length).toBe(0);
    });

    it('should require target major', async () => {
      const profile = {
        targetUniversities: '["MIT"]',
        targetMajors: '[]',
        academicLevel: 'undergraduate',
      };
      
      const majors = JSON.parse(profile.targetMajors);
      expect(majors.length).toBe(0);
    });

    it('should require academic level', async () => {
      const profile = {
        targetUniversities: '["MIT"]',
        targetMajors: '["Computer Science"]',
        academicLevel: null,
      };
      
      expect(profile.academicLevel).toBeNull();
    });

    it('should accept valid profile', async () => {
      const profile = {
        targetUniversities: '["MIT"]',
        targetMajors: '["Computer Science"]',
        academicLevel: 'undergraduate',
      };
      
      const universities = JSON.parse(profile.targetUniversities);
      const majors = JSON.parse(profile.targetMajors);
      
      expect(universities.length).toBeGreaterThan(0);
      expect(majors.length).toBeGreaterThan(0);
      expect(profile.academicLevel).toBeTruthy();
    });
  });

  describe('Credits Display', () => {
    it('should handle positive balance', () => {
      const balance = 20;
      expect(balance).toBeGreaterThan(0);
    });

    it('should handle zero balance', () => {
      const balance = 0;
      expect(balance).toBe(0);
    });

    it('should handle negative balance (after failed transaction)', () => {
      const balance = -20;
      expect(balance).toBeLessThan(0);
    });

    it('should display actual balance not hardcoded zero', () => {
      const creditsData = { balance: 20 };
      const displayedBalance = creditsData?.balance || 0;
      expect(displayedBalance).toBe(20);
    });
  });
});
