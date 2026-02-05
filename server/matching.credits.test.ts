import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as db from './db';
import * as credits from './services/credits';
import * as llmMatching from './services/llmMatching';

// Mock dependencies
vi.mock('./db');
vi.mock('./services/credits');
vi.mock('./services/llmMatching');
vi.mock('./services/normalization');
vi.mock('./services/profileCache');
vi.mock('./services/simplifiedMatching');

describe('Matching Credits Deduction Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateMatches - Credits deduction timing', () => {
    it('should NOT deduct credits if LLM call fails', async () => {
      // Setup: User has enough credits
      vi.mocked(credits.checkAndResetCredits).mockResolvedValue(100);
      
      // Setup: Profile exists with required fields
      vi.mocked(db.getStudentProfile).mockResolvedValue({
        id: 1,
        userId: 'user123',
        targetUniversities: JSON.stringify(['MIT']),
        targetMajors: JSON.stringify(['Biology']),
        academicLevel: 'undergraduate',
        gpa: null,
        skills: null,
        interests: null,
        bio: null,
        resumeUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      vi.mocked(db.getUserActivities).mockResolvedValue([]);
      
      // Setup: LLM call fails
      vi.mocked(llmMatching.generateMatchedProjects).mockRejectedValue(
        new Error('LLM API error')
      );
      
      // Execute: Try to calculate matches
      const { matchingRouter } = await import('./routers/matching');
      const caller = matchingRouter.createCaller({
        user: { id: 'user123', role: 'user' },
        req: {} as any,
        res: {} as any,
      });
      
      // Expect: Should throw error and NOT deduct credits
      await expect(caller.calculateMatches({ language: 'en' })).rejects.toThrow();
      
      // Verify: deductCredits should NOT have been called
      expect(credits.deductCredits).not.toHaveBeenCalled();
    });

    it('should deduct credits AFTER successful LLM call', async () => {
      // Setup: User has enough credits
      vi.mocked(credits.checkAndResetCredits).mockResolvedValue(100);
      
      // Setup: Profile exists
      vi.mocked(db.getStudentProfile).mockResolvedValue({
        id: 1,
        userId: 'user123',
        targetUniversities: JSON.stringify(['MIT']),
        targetMajors: JSON.stringify(['Biology']),
        academicLevel: 'undergraduate',
        gpa: null,
        skills: null,
        interests: null,
        bio: null,
        resumeUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      vi.mocked(db.getUserActivities).mockResolvedValue([]);
      
      // Setup: LLM call succeeds
      vi.mocked(llmMatching.generateMatchedProjects).mockResolvedValue([
        {
          projectName: 'Test Project',
          professorName: 'Dr. Smith',
          researchDirection: 'AI Research',
          description: 'Test description',
          matchScore: 85,
          matchReason: 'Good fit',
        },
      ]);
      
      vi.mocked(db.deleteUserMatches).mockResolvedValue(undefined);
      vi.mocked(db.createProjectMatch).mockResolvedValue(1);
      vi.mocked(llmMatching.triggerBackgroundCrawler).mockReturnValue(undefined);
      
      // Execute: Calculate matches
      const { matchingRouter } = await import('./routers/matching');
      const caller = matchingRouter.createCaller({
        user: { id: 'user123', role: 'user' },
        req: {} as any,
        res: {} as any,
      });
      
      await caller.calculateMatches({ language: 'en' });
      
      // Verify: deductCredits should have been called AFTER LLM success
      expect(credits.deductCredits).toHaveBeenCalledWith('user123', 40, 'project_matching');
    });
  });

  describe('refreshMatches - Credits deduction timing', () => {
    it('should NOT deduct credits if LLM call fails', async () => {
      // Setup: User has enough credits
      vi.mocked(credits.checkAndResetCredits).mockResolvedValue(100);
      
      // Setup: Profile exists
      vi.mocked(db.getStudentProfile).mockResolvedValue({
        id: 1,
        userId: 'user123',
        targetUniversities: JSON.stringify(['MIT']),
        targetMajors: JSON.stringify(['Biology']),
        academicLevel: 'undergraduate',
        gpa: null,
        skills: null,
        interests: null,
        bio: null,
        resumeUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      vi.mocked(db.getUserMatches).mockResolvedValue([]);
      vi.mocked(db.getUserActivities).mockResolvedValue([]);
      
      // Setup: Database has no projects, will call LLM
      const { hasSufficientProjects } = await import('./services/simplifiedMatching');
      vi.mocked(hasSufficientProjects).mockResolvedValue(false);
      
      // Setup: LLM call fails
      vi.mocked(llmMatching.generateMatchedProjects).mockRejectedValue(
        new Error('LLM API error')
      );
      
      // Execute: Try to refresh matches
      const { matchingRouter } = await import('./routers/matching');
      const caller = matchingRouter.createCaller({
        user: { id: 'user123', role: 'user' },
        req: {} as any,
        res: {} as any,
      });
      
      // Expect: Should throw error and NOT deduct credits
      await expect(caller.refreshMatches({ language: 'en' })).rejects.toThrow();
      
      // Verify: deductCredits should NOT have been called
      expect(credits.deductCredits).not.toHaveBeenCalled();
    });

    it('should deduct credits AFTER successful match retrieval', async () => {
      // Clear all previous mocks first
      vi.clearAllMocks();
      
      // Setup: User has enough credits
      vi.mocked(credits.checkAndResetCredits).mockResolvedValue(100);
      
      // Setup: Profile exists
      vi.mocked(db.getStudentProfile).mockResolvedValue({
        id: 1,
        userId: 'user123',
        targetUniversities: JSON.stringify(['MIT']),
        targetMajors: JSON.stringify(['Biology']),
        academicLevel: 'undergraduate',
        gpa: null,
        skills: null,
        interests: null,
        bio: null,
        resumeUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      vi.mocked(db.getUserMatches).mockResolvedValue([]);
      vi.mocked(db.getUserActivities).mockResolvedValue([]);
      
      // Setup: Database has sufficient projects
      const { hasSufficientProjects, getRandomProjectsFromDatabase } = await import('./services/simplifiedMatching');
      vi.mocked(hasSufficientProjects).mockResolvedValue(true);
      vi.mocked(getRandomProjectsFromDatabase).mockResolvedValue([
        {
          projectName: 'DB Project',
          professorName: 'Dr. Johnson',
          researchDirection: 'ML Research',
          description: 'Test description',
          matchScore: 80,
          matchReason: 'From database',
        },
      ]);
      
      vi.mocked(db.deleteUserMatches).mockResolvedValue(undefined);
      vi.mocked(db.createProjectMatch).mockResolvedValue(1);
      
      // Important: Don't mock LLM to fail for this test
      vi.mocked(llmMatching.generateMatchedProjects).mockResolvedValue([]);
      
      // Execute: Refresh matches
      const { matchingRouter } = await import('./routers/matching');
      const caller = matchingRouter.createCaller({
        user: { id: 'user123', role: 'user' },
        req: {} as any,
        res: {} as any,
      });
      
      await caller.refreshMatches({ language: 'en' });
      
      // Verify: deductCredits should have been called AFTER getting matches
      expect(credits.deductCredits).toHaveBeenCalledWith('user123', 40, 'project_refresh');
    });
  });

  describe('Admin users - No credits deduction', () => {
    it('should NOT deduct credits for admin users even on success', async () => {
      // Setup: Admin user
      vi.mocked(db.getStudentProfile).mockResolvedValue({
        id: 1,
        userId: 'admin123',
        targetUniversities: JSON.stringify(['MIT']),
        targetMajors: JSON.stringify(['Biology']),
        academicLevel: 'undergraduate',
        gpa: null,
        skills: null,
        interests: null,
        bio: null,
        resumeUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      vi.mocked(db.getUserActivities).mockResolvedValue([]);
      
      // Setup: LLM call succeeds
      vi.mocked(llmMatching.generateMatchedProjects).mockResolvedValue([
        {
          projectName: 'Test Project',
          professorName: 'Dr. Smith',
          researchDirection: 'AI Research',
          description: 'Test description',
          matchScore: 85,
          matchReason: 'Good fit',
        },
      ]);
      
      vi.mocked(db.deleteUserMatches).mockResolvedValue(undefined);
      vi.mocked(db.createProjectMatch).mockResolvedValue(1);
      vi.mocked(llmMatching.triggerBackgroundCrawler).mockReturnValue(undefined);
      
      // Execute: Calculate matches as admin
      const { matchingRouter } = await import('./routers/matching');
      const caller = matchingRouter.createCaller({
        user: { id: 'admin123', role: 'admin' },
        req: {} as any,
        res: {} as any,
      });
      
      await caller.calculateMatches({ language: 'en' });
      
      // Verify: deductCredits should NOT have been called for admin
      expect(credits.deductCredits).not.toHaveBeenCalled();
      expect(credits.checkAndResetCredits).not.toHaveBeenCalled();
    });
  });
});
