import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import * as db from './db';
import { NormalizationService } from './services/normalization';
import { hasSufficientProjects } from './services/simplifiedMatching';
import { generateMatchedProjects } from './services/llmMatching';

// Mock dependencies
vi.mock('./db');
vi.mock('./services/normalization');
vi.mock('./services/simplifiedMatching');
vi.mock('./services/llmMatching');

// Helper to create test context
function createTestContext(userId: number, role: 'user' | 'admin' = 'user'): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: 'manus',
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  };
}

describe('Refresh Matches - Core Functionality', () => {
  const mockUserId = 1;
  const mockProfile = {
    id: mockUserId,
    userId: mockUserId,
    targetUniversities: JSON.stringify(['Stanford University']),
    targetMajors: JSON.stringify(['Computer Science']),
    academicLevel: 'undergraduate',
    gpa: '3.8',
    skills: JSON.stringify(['Python', 'Machine Learning']),
    interests: JSON.stringify(['AI', 'Robotics']),
    bio: 'Interested in AI research',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNewProjects = [
    {
      projectName: 'New Project 1',
      professorName: 'Prof. Johnson',
      lab: 'Robotics Lab',
      researchDirection: 'Robotics',
      description: 'Robotics research',
      requirements: 'Strong programming skills',
      contactEmail: 'johnson@stanford.edu',
      url: 'https://stanford.edu/robotics',
      matchScore: 90,
      matchReason: 'Excellent fit for your interests',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(db.getStudentProfile).mockResolvedValue(mockProfile);
    vi.mocked(NormalizationService.normalizeUniversity).mockResolvedValue({
      normalizedName: 'Stanford University',
      confidence: 0.95,
      source: 'cache',
    });
    vi.mocked(NormalizationService.normalizeMajor).mockResolvedValue({
      normalizedName: 'Computer Science',
      confidence: 0.95,
      source: 'cache',
    });
    vi.mocked(db.getUserMatches).mockResolvedValue([]);
    vi.mocked(db.getUserActivities).mockResolvedValue([]);
    vi.mocked(db.deleteUserMatches).mockResolvedValue(undefined);
    vi.mocked(db.createProjectMatch).mockImplementation(async () => Date.now());
  });

  it('should call LLM when database has insufficient projects', async () => {
    vi.mocked(hasSufficientProjects).mockResolvedValue(false);
    vi.mocked(generateMatchedProjects).mockResolvedValue(mockNewProjects);

    const ctx = createTestContext(mockUserId, 'admin');
    const caller = appRouter.createCaller(ctx);

    const result = await caller.matching.refreshMatches({ language: 'en' });

    expect(result.strategy).toBe('llm_refresh');
    expect(result.matches.length).toBeGreaterThan(0);
    expect(generateMatchedProjects).toHaveBeenCalled();
  });

  it('should throw error when profile is missing', async () => {
    vi.mocked(db.getStudentProfile).mockResolvedValue(null);

    const ctx = createTestContext(mockUserId, 'admin');
    const caller = appRouter.createCaller(ctx);

    await expect(caller.matching.refreshMatches({ language: 'en' })).rejects.toThrow(
      'Please complete your profile first'
    );
  });

  it('should throw error when target university is missing', async () => {
    vi.mocked(db.getStudentProfile).mockResolvedValue({
      ...mockProfile,
      targetUniversities: JSON.stringify([]),
    });

    const ctx = createTestContext(mockUserId, 'admin');
    const caller = appRouter.createCaller(ctx);

    await expect(caller.matching.refreshMatches({ language: 'en' })).rejects.toThrow(
      'Please specify your target university and major in your profile'
    );
  });

  it('should delete old matches before saving new ones', async () => {
    vi.mocked(hasSufficientProjects).mockResolvedValue(false);
    vi.mocked(generateMatchedProjects).mockResolvedValue(mockNewProjects);

    const ctx = createTestContext(mockUserId, 'admin');
    const caller = appRouter.createCaller(ctx);

    await caller.matching.refreshMatches({ language: 'en' });

    expect(db.deleteUserMatches).toHaveBeenCalledWith(mockUserId);
    expect(db.createProjectMatch).toHaveBeenCalled();
  });
});
