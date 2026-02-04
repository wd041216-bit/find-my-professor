import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeUserProfile } from './intelligentMatching';
import { getDb } from '../db';
import { studentProfiles, activities } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Intelligent Matching Service', () => {
  const testUserId = 888888; // Use a high ID to avoid conflicts

  beforeEach(async () => {
    // Clean up test data
    const db = await getDb();
    if (db) {
      await db.delete(studentProfiles).where(eq(studentProfiles.userId, testUserId));
      await db.delete(activities).where(eq(activities.userId, testUserId));
    }
  });

  it('should identify minimal profile (no data)', async () => {
    const analysis = await analyzeUserProfile(testUserId);
    
    expect(analysis.hasRichProfile).toBe(false);
    expect(analysis.profileCompleteness).toBeLessThan(60);
  });

  it('should identify rich profile with complete data', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Create a rich profile
    await db.insert(studentProfiles).values({
      userId: testUserId,
      academicLevel: 'undergraduate',
      currentUniversity: 'Test University',
      currentMajor: 'Computer Science',
      gpa: '3.8',
      skills: JSON.stringify(['Python', 'Machine Learning', 'Data Analysis']),
      interests: JSON.stringify(['AI', 'Computer Vision', 'NLP']),
      targetUniversities: JSON.stringify(['Stanford', 'MIT']),
      targetMajors: JSON.stringify(['Computer Science', 'AI']),
    });
    
    // Add activities
    await db.insert(activities).values([
      {
        userId: testUserId,
        title: 'Research Intern',
        category: 'research',
        organization: 'AI Lab',
        role: 'Research Assistant',
        description: 'Worked on computer vision projects',
        startDate: new Date('2023-01-01'),
      },
      {
        userId: testUserId,
        title: 'Hackathon Winner',
        category: 'competition',
        organization: 'Tech Competition',
        role: 'Team Lead',
        description: 'Won first place in ML competition',
        startDate: new Date('2023-06-01'),
      },
    ]);
    
    const analysis = await analyzeUserProfile(testUserId);
    
    expect(analysis.hasRichProfile).toBe(true);
    expect(analysis.profileCompleteness).toBeGreaterThanOrEqual(60);
    expect(analysis.strengths.length).toBeGreaterThan(0);
    expect(analysis.researchInterests.length).toBeGreaterThan(0);
    expect(analysis.targetUniversities).toContain('Stanford');
    expect(analysis.targetMajors).toContain('Computer Science');
  });

  it('should calculate correct completeness score', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Create a partial profile
    await db.insert(studentProfiles).values({
      userId: testUserId,
      academicLevel: 'undergraduate',
      currentUniversity: 'Test University',
      currentMajor: 'Computer Science',
      gpa: '3.5',
      // No skills, interests, or targets
    });
    
    const analysis = await analyzeUserProfile(testUserId);
    
    // Should have 40% completeness (4 fields * 10% each)
    expect(analysis.profileCompleteness).toBe(40);
    expect(analysis.hasRichProfile).toBe(false);
  });

  it('should handle missing profile gracefully', async () => {
    const analysis = await analyzeUserProfile(999999); // Non-existent user
    
    expect(analysis.hasRichProfile).toBe(false);
    expect(analysis.profileCompleteness).toBe(0);
    expect(analysis.strengths).toEqual([]);
    expect(analysis.researchInterests).toEqual([]);
  });

  it('should parse JSON fields correctly', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.insert(studentProfiles).values({
      userId: testUserId,
      academicLevel: 'graduate',
      skills: JSON.stringify(['Skill1', 'Skill2', 'Skill3']),
      interests: JSON.stringify(['Interest1', 'Interest2']),
      targetUniversities: JSON.stringify(['Harvard', 'Yale']),
      targetMajors: JSON.stringify(['Biology', 'Chemistry']),
    });
    
    const analysis = await analyzeUserProfile(testUserId);
    
    expect(analysis.strengths).toHaveLength(3);
    expect(analysis.researchInterests).toHaveLength(2);
    expect(analysis.targetUniversities).toHaveLength(2);
    expect(analysis.targetMajors).toHaveLength(2);
  });
});
