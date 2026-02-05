import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { generateMatchedProjects, triggerBackgroundCrawler, type UserProfile, type MatchedProject } from "../services/llmMatching";
import { deductCredits, checkAndResetCredits } from "../services/credits";
import { NormalizationService } from "../services/normalization";
import { getCachedMatches, cacheMatches } from "../services/profileCache";
import { isSimplifiedProfile, getRandomProjectsFromDatabase, hasSufficientProjects } from "../services/simplifiedMatching";
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
    // Step 1: Check credits (40 points for matching, includes normalization)
    // Skip credit check for admin users
    if (ctx.user.role !== 'admin') {
      const currentCredits = await checkAndResetCredits(ctx.user.id);
      if (currentCredits < 40) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'INSUFFICIENT_CREDITS',
        });
      }
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

    // Step 3.5: Normalize university and major names (delayed from profile save)
    let university = targetUniversities[0];
    let major = targetMajors[0];
    
    try {
      const [normalizedUniversity, normalizedMajor] = await Promise.all([
        NormalizationService.normalizeUniversity(university, ctx.user.id),
        NormalizationService.normalizeMajor(major, ctx.user.id)
      ]);
      university = normalizedUniversity.normalizedName;
      major = normalizedMajor.normalizedName;
      console.log(`[Matching] Normalized: "${targetUniversities[0]}" → "${university}", "${targetMajors[0]}" → "${major}"`);
    } catch (error) {
      console.error('[Matching] Normalization failed, using raw input:', error);
      // Continue with raw input if normalization fails
    }

    // Step 3.6: Parse resume if uploaded but not yet parsed
    let activities = await db.getUserActivities(ctx.user.id);
    if (profile.resumeUrl && activities.length === 0) {
      try {
        console.log(`[Matching] Parsing resume for user ${ctx.user.id}...`);
        // Import resume router to call parse function
        const { resumeRouter } = await import("./resume");
        const caller = resumeRouter.createCaller(ctx);
        await caller.parse({ fileUrl: profile.resumeUrl });
        console.log(`[Matching] Resume parsed successfully`);
      } catch (error) {
        console.error('[Matching] Resume parsing failed:', error);
        // Continue without resume data if parsing fails
      }
    }
    
    // Step 4: Build user profile for LLM (re-fetch activities after resume parsing)
    activities = await db.getUserActivities(ctx.user.id);
    const skills = profile.skills ? JSON.parse(profile.skills) : undefined;
    const interests = profile.interests ? JSON.parse(profile.interests) : undefined;
    const userProfile: UserProfile = {
      academicLevel: profile.academicLevel || undefined,
      gpa: profile.gpa || undefined,
      skills,
      interests,
      bio: profile.bio || undefined,
      activities: activities.map(a => ({
        title: a.title,
        category: a.category,
        description: a.description || undefined,
        role: a.role || undefined,
      })),
    };
    
    // Step 4.5: Check if this is a simplified profile
    const isSimplified = isSimplifiedProfile(skills, interests, activities, profile.bio || undefined);
    console.log(`[Matching] Profile type: ${isSimplified ? 'SIMPLIFIED' : 'DETAILED'}`);

    // Step 5: Check profile cache (only for non-simplified profiles)
    let matches: MatchedProject[] = [];
    let strategy = 'llm_direct';
    
    if (!isSimplified) {
      // Try to get cached matches for detailed profiles
      const hasSkills = skills && skills.length > 0;
      const hasActivities = activities.length > 0;
      const cachedMatches = await getCachedMatches(
        university,
        major,
        profile.academicLevel || undefined,
        hasSkills,
        hasActivities
      );
      
      if (cachedMatches && cachedMatches.length > 0) {
        console.log(`[Matching] Using cached matches (${cachedMatches.length} projects)`);
        matches = cachedMatches;
        strategy = 'cache_hit';
      }
    }
    
    // Step 6: If no cache hit, decide strategy based on profile type
    if (matches.length === 0) {
      if (isSimplified) {
        // Simplified profile: try database first
        console.log(`[Matching] Simplified profile detected, checking database...`);
        const hasProjects = await hasSufficientProjects(university, major, 5);
        
        if (hasProjects) {
          // Use random database selection
          console.log(`[Matching] Using database random selection`);
          matches = await getRandomProjectsFromDatabase(university, major, 10);
          strategy = 'database_random';
        } else {
          // Database empty, trigger scraping
          console.log(`[Matching] Database empty, triggering scraper...`);
          // For simplified profiles with no database, we still need to call LLM
          // but we'll use a simpler prompt
          strategy = 'llm_fallback';
        }
      }
      
      // Step 7: If still no matches, use LLM
      if (matches.length === 0) {
        // Deduct credits before LLM call
        if (ctx.user.role !== 'admin') {
          await deductCredits(ctx.user.id, 40, 'project_matching');
        }
        
        console.log(`[Matching] Calling LLM for matching...`);
        matches = await generateMatchedProjects(university, major, userProfile, language);
        
        // Cache the results for future use (only for detailed profiles)
        if (!isSimplified && matches.length > 0) {
          const hasSkills = skills && skills.length > 0;
          const hasActivities = activities.length > 0;
          await cacheMatches(
            university,
            major,
            profile.academicLevel || undefined,
            hasSkills,
            hasActivities,
            matches
          );
        }
      } else if (strategy === 'database_random') {
        // For database random selection, deduct reduced credits (20 instead of 40)
        if (ctx.user.role !== 'admin') {
          await deductCredits(ctx.user.id, 20, 'project_matching');
        }
      }
    } else {
      // Cache hit, deduct minimal credits (10 instead of 40)
      if (ctx.user.role !== 'admin') {
        await deductCredits(ctx.user.id, 10, 'project_matching');
      }
    }

    // Step 6.5: Delete old matches for this user to avoid duplicates
    await db.deleteUserMatches(ctx.user.id);

    // Step 7: Save matches to database and collect IDs
    const matchesWithIds = [];
    for (const match of matches) {
      const matchId = await db.createProjectMatch({
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
      matchesWithIds.push({ ...match, id: matchId });
    }

    // Step 8: Trigger background crawler (async, doesn't block)
    triggerBackgroundCrawler(university, major);

    return {
      totalMatches: matchesWithIds.length,
      matches: matchesWithIds.map(m => ({
        id: m.id,
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
      strategy,
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
