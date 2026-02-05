import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { generateMatchedProjects, triggerBackgroundCrawler, type UserProfile, type MatchedProject } from "../services/llmMatching";
import { deductCredits, checkAndResetCredits } from "../services/credits";
import { TRPCError } from "@trpc/server";

export const matchingRouter = router({
  // Calculate matches for current user
  // Frontend: LLM generates 8-10 matches instantly
  // Background: Crawler silently scrapes all projects for the university/major
  calculateMatches: protectedProcedure
    .input(z.object({
      language: z.enum(['en', 'zh']).optional().default('en'),
    }).optional())
    .mutation(async ({ ctx, input }) => {
    const language = input?.language || 'en';
    // Step 1: Check credits (30 points for matching)
    const currentCredits = await checkAndResetCredits(ctx.user.id);
    if (currentCredits < 30) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'INSUFFICIENT_CREDITS',
      });
    }

    // Step 2: Get user profile
    const profile = await db.getStudentProfile(ctx.user.id);
    if (!profile) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Please complete your profile first',
      });
    }

    // Step 3: Validate target university and major
    const targetUniversities = profile.targetUniversities ? JSON.parse(profile.targetUniversities) : [];
    const targetMajors = profile.targetMajors ? JSON.parse(profile.targetMajors) : [];

    if (targetUniversities.length === 0 || targetMajors.length === 0) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Please specify your target university and major in your profile',
      });
    }

    // For now, use first university and first major
    const university = targetUniversities[0];
    const major = targetMajors[0];

    // Step 4: Build user profile for LLM
    const activities = await db.getUserActivities(ctx.user.id);
    const userProfile: UserProfile = {
      academicLevel: profile.academicLevel || undefined,
      gpa: profile.gpa || undefined,
      skills: profile.skills ? JSON.parse(profile.skills) : undefined,
      interests: profile.interests ? JSON.parse(profile.interests) : undefined,
      bio: profile.bio || undefined,
      activities: activities.map(a => ({
        title: a.title,
        category: a.category,
        description: a.description || undefined,
        role: a.role || undefined,
      })),
    };

    // Step 5: Deduct credits
    await deductCredits(ctx.user.id, 30, 'project_matching');

    // Step 6: Generate matches with LLM (fast, returns immediately)
    const matches: MatchedProject[] = await generateMatchedProjects(university, major, userProfile, language);

    // Step 7: Save matches to database
    for (const match of matches) {
      await db.createProjectMatch({
        userId: ctx.user.id,
        projectName: match.projectName,
        professorName: match.professorName,
        lab: match.lab || null,
        researchDirection: match.researchDirection,
        description: match.description,
        requirements: match.requirements || null,
        contactEmail: match.contactEmail || null,
        url: match.url || null,
        matchScore: match.matchScore.toString(),
        matchReasons: JSON.stringify([match.matchReason]),
        university,
        major,
        viewed: false,
        saved: false,
        applied: false,
      });
    }

    // Step 8: Trigger background crawler (async, doesn't block)
    triggerBackgroundCrawler(university, major);

    return {
      totalMatches: matches.length,
      matches: matches.map(m => ({
        projectName: m.projectName,
        professorName: m.professorName,
        lab: m.lab,
        researchDirection: m.researchDirection,
        description: m.description,
        requirements: m.requirements,
        contactEmail: m.contactEmail,
        url: m.url,
        matchScore: m.matchScore,
        matchReason: m.matchReason,
      })),
      strategy: 'llm_direct',
      university,
      major,
    };
  }),

  // Get match history for current user
  getMatchHistory: protectedProcedure.query(async ({ ctx }) => {
    const matches = await db.getUserMatches(ctx.user.id);
    return matches;
  }),

  // Mark match as viewed
  markAsViewed: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateMatchStatus(input.matchId, { viewed: true });
      return { success: true };
    }),

  // Save match for later
  saveMatch: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateMatchStatus(input.matchId, { saved: true });
      return { success: true };
    }),

  // Mark as applied
  markAsApplied: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateMatchStatus(input.matchId, { applied: true });
      return { success: true };
    }),
});
