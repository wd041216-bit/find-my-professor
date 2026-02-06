import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { generateMatchedProjects, triggerBackgroundCrawler, type UserProfile, type MatchedProject } from "../services/llmMatching";
// URL generation removed - using LLM-generated URLs directly
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
    let targetUniversities: string[] = [];
    let targetMajors: string[] = [];
    
    try {
      targetUniversities = profile.targetUniversities ? JSON.parse(profile.targetUniversities) : [];
      if (!Array.isArray(targetUniversities)) targetUniversities = [];
    } catch (e) {
      console.error('[Matching] Failed to parse targetUniversities:', e);
      targetUniversities = [];
    }
    
    try {
      targetMajors = profile.targetMajors ? JSON.parse(profile.targetMajors) : [];
      if (!Array.isArray(targetMajors)) targetMajors = [];
    } catch (e) {
      console.error('[Matching] Failed to parse targetMajors:', e);
      targetMajors = [];
    }

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
          // Database empty, need to call LLM to generate initial projects
          console.log(`[Matching] Database empty for simplified profile, will call LLM...`);
          strategy = 'llm_fallback';
          // Don't set matches here, let it fall through to Step 7
        }
      }
      
      // Step 7: If still no matches, use LLM
      if (matches.length === 0) {
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
      }
    }
    
    // Step 7.5: Check if matches are insufficient (<10) and supplement with LLM
    if (matches.length < 10) {
      console.log(`[Matching] Insufficient matches (${matches.length}), supplementing with LLM...`);
      const needed = 10 - matches.length;
      const existingProjectNames = new Set(matches.map(m => m.projectName));
      
      // Call LLM to generate additional projects
      const supplementMatches = await generateMatchedProjects(university, major, userProfile, language);
      
      // Filter out duplicates and take only what we need
      const newMatches = supplementMatches
        .filter(m => !existingProjectNames.has(m.projectName))
        .slice(0, needed);
      
      console.log(`[Matching] Added ${newMatches.length} supplemental matches from LLM`);
      matches = [...matches, ...newMatches];
      
      // Update strategy to indicate supplementation
      if (strategy === 'database_random') {
        strategy = 'database_supplemented';
      } else if (strategy === 'cache_hit') {
        strategy = 'cache_supplemented';
      }
    }
    
    // Deduct credits uniformly for all search types (40 credits)
    // All searches cost the same regardless of cache hit, database random, or LLM matching
    if (ctx.user.role !== 'admin') {
      await deductCredits(ctx.user.id, 40, 'project_matching');
    }

    // Step 6.5: Delete old matches for this user to avoid duplicates
    await db.deleteUserMatches(ctx.user.id);

    // Step 7: Save matches to database and collect IDs
    if (!Array.isArray(matches)) {
      console.error('[Matching] Invalid matches structure, not an array:', typeof matches, matches);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Invalid matches structure from LLM',
      });
    }
    
    // URLs are generated by LLM during matching - no need for separate URL generation

    const matchesWithIds = [];
    for (const match of matches) {
      if (!match || typeof match !== 'object') {
        console.warn('[Matching] Skipping invalid match:', match);
        continue;
      }
      
      try {
        // Use LLM-generated URL directly
        const projectUrl = match.url || null;
        
        const matchId = await db.createProjectMatch({
          userId: ctx.user.id,
          projectName: match.projectName || 'Untitled Project',
          professorName: match.professorName || 'Unknown Professor',
          lab: match.lab || null,
          researchDirection: match.researchDirection || 'Not specified',
          description: match.description || 'No description available',
          requirements: match.requirements || null,
          contactEmail: match.contactEmail || null,
          url: projectUrl,
          matchScore: (match.matchScore || 0).toString(),
          matchReasons: JSON.stringify([match.matchReason || 'No reason provided']),
          university,
          major,
          viewed: false,
          saved: false,
          applied: false,
        });
        matchesWithIds.push({ ...match, id: matchId });
      } catch (error) {
        console.error('[Matching] Error saving match to database:', error, 'Match:', match);
        // Continue with next match instead of failing completely
      }
    }

    if (matchesWithIds.length === 0) {
      console.warn('[Matching] No matches were successfully saved to database');
    }

    // Step 8: Trigger background crawler only if database has <20 projects (async, doesn't block)
    const dbProjectCount = await hasSufficientProjects(university, major, 20);
    if (!dbProjectCount) {
      console.log(`[Matching] Database has <20 projects, triggering background crawler for ${university} - ${major}`);
      triggerBackgroundCrawler(university, major).catch(error => {
        console.error(`[Matching] Background crawler error:`, error);
      });
    } else {
      console.log(`[Matching] Database has >=20 projects, skipping crawler for ${university} - ${major}`);
    }

    // Validate return structure
    const returnMatches = matchesWithIds.map(m => {
      if (!m || typeof m !== 'object') {
        console.warn('[Matching] Invalid match in return:', m);
        return null;
      }
      return {
        id: m.id || 0,
        projectName: m.projectName || 'Untitled',
        professorName: m.professorName || 'Unknown',
        lab: m.lab || null,
        researchDirection: m.researchDirection || 'Not specified',
        description: m.description || '',
        requirements: m.requirements || null,
        contactEmail: m.contactEmail || null,
        url: m.url || null,
        matchScore: m.matchScore || 0,
        matchReason: m.matchReason || 'No reason provided',
      };
    }).filter((m): m is any => m !== null);

    return {
      totalMatches: returnMatches.length,
      matches: returnMatches,
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

  // Refresh matches - get a new batch of projects
  // Strategy: Try database first (if crawler has populated data), fallback to LLM if insufficient
  refreshMatches: protectedProcedure
    .input(z.object({
      language: z.enum(['en', 'zh']).optional().default('en'),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const language = input?.language || 'en';
      
      // Step 1: Get user profile
      const profile = await db.getStudentProfile(ctx.user.id);
      if (!profile) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Please complete your profile first',
        });
      }

      // Step 2: Get normalized university and major from profile
      let targetUniversities: string[] = [];
      let targetMajors: string[] = [];
      
      try {
        targetUniversities = profile.targetUniversities ? JSON.parse(profile.targetUniversities) : [];
        if (!Array.isArray(targetUniversities)) targetUniversities = [];
      } catch (e) {
        console.error('[RefreshMatches] Failed to parse targetUniversities:', e);
        targetUniversities = [];
      }
      
      try {
        targetMajors = profile.targetMajors ? JSON.parse(profile.targetMajors) : [];
        if (!Array.isArray(targetMajors)) targetMajors = [];
      } catch (e) {
        console.error('[RefreshMatches] Failed to parse targetMajors:', e);
        targetMajors = [];
      }

      if (targetUniversities.length === 0 || targetMajors.length === 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Please specify your target university and major in your profile',
        });
      }

      let university = targetUniversities[0];
      let major = targetMajors[0];
      
      // Step 3: Normalize university and major names
      try {
        const [normalizedUniversity, normalizedMajor] = await Promise.all([
          NormalizationService.normalizeUniversity(university, ctx.user.id),
          NormalizationService.normalizeMajor(major, ctx.user.id)
        ]);
        university = normalizedUniversity.normalizedName;
        major = normalizedMajor.normalizedName;
        console.log(`[RefreshMatches] Normalized: "${targetUniversities[0]}" → "${university}", "${targetMajors[0]}" → "${major}"`);
      } catch (error) {
        console.error('[RefreshMatches] Normalization failed, using raw input:', error);
      }

      // Step 4: Get existing match IDs to exclude them from new results
      const existingMatches = await db.getUserMatches(ctx.user.id);
      const existingProjectNames = new Set(existingMatches.map(m => m.projectName));

      // Step 5: Check credits first (40 points for refresh, same as initial match)
      if (ctx.user.role !== 'admin') {
        const currentCredits = await checkAndResetCredits(ctx.user.id);
        if (currentCredits < 40) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'INSUFFICIENT_CREDITS',
          });
        }
        // Don't deduct yet - wait until we successfully get matches
      }

      // Step 6: Try to get projects from database first (crawler results)
      let matches: MatchedProject[] = [];
      let strategy = 'database_refresh';
      
      const hasProjects = await hasSufficientProjects(university, major, 10);
      
      if (hasProjects) {
        // Get more projects from database and filter out existing ones
        console.log(`[RefreshMatches] Getting new batch from database...`);
        const allDbProjects = await getRandomProjectsFromDatabase(university, major, 20);
        matches = allDbProjects.filter(p => !existingProjectNames.has(p.projectName)).slice(0, 10);
        
        if (matches.length < 5) {
          // Not enough new projects in database, call LLM
          console.log(`[RefreshMatches] Insufficient new projects in database (${matches.length}), calling LLM...`);
          strategy = 'llm_refresh';
          matches = [];
        }
      } else {
        console.log(`[RefreshMatches] Database has insufficient projects, calling LLM...`);
        strategy = 'llm_refresh';
      }

      // Step 7: If database doesn't have enough new projects, call LLM
      if (matches.length === 0) {
        // Build user profile for LLM
        const activities = await db.getUserActivities(ctx.user.id);
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

        console.log(`[RefreshMatches] Calling LLM for new matches...`);
        matches = await generateMatchedProjects(university, major, userProfile, language);
      }
      
      // Step 7.3: Check if matches are insufficient (<10) and supplement with LLM
      if (matches.length < 10) {
        console.log(`[RefreshMatches] Insufficient matches (${matches.length}), supplementing with LLM...`);
        const needed = 10 - matches.length;
        const existingProjectNames = new Set([...existingMatches.map(m => m.projectName), ...matches.map(m => m.projectName)]);
        
        // Build user profile for LLM (reuse from Step 7 if available)
        let supplementUserProfile: UserProfile;
        if (matches.length === 0) {
          // userProfile was already built in Step 7
          const activities = await db.getUserActivities(ctx.user.id);
          const skills = profile.skills ? JSON.parse(profile.skills) : undefined;
          const interests = profile.interests ? JSON.parse(profile.interests) : undefined;
          supplementUserProfile = {
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
        } else {
          // Build fresh profile for supplementation
          const activities = await db.getUserActivities(ctx.user.id);
          const skills = profile.skills ? JSON.parse(profile.skills) : undefined;
          const interests = profile.interests ? JSON.parse(profile.interests) : undefined;
          supplementUserProfile = {
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
        }
        
        // Call LLM to generate additional projects
        const supplementMatches = await generateMatchedProjects(university, major, supplementUserProfile, language);
        
        // Filter out duplicates and take only what we need
        const newMatches = supplementMatches
          .filter(m => !existingProjectNames.has(m.projectName))
          .slice(0, needed);
        
        console.log(`[RefreshMatches] Added ${newMatches.length} supplemental matches from LLM`);
        matches = [...matches, ...newMatches];
        
        // Update strategy to indicate supplementation
        if (strategy === 'database_refresh') {
          strategy = 'database_supplemented';
        }
      }

      // Step 7.5: Deduct credits AFTER successfully getting matches
      if (ctx.user.role !== 'admin') {
        await deductCredits(ctx.user.id, 40, 'project_refresh');
      }

      // Step 8: Delete old matches and save new ones
      await db.deleteUserMatches(ctx.user.id);

      // Step 8.5: Generate URLs in batch for all projects
      // URLs are generated by LLM during matching - no need for separate URL generation

      const matchesWithIds = [];
      for (const match of matches) {
        // Use LLM-generated URL directly
        const projectUrl = match.url || null;
        
        const matchId = await db.createProjectMatch({
          userId: ctx.user.id,
          projectName: match.projectName,
          professorName: match.professorName,
          lab: match.lab || null,
          researchDirection: match.researchDirection,
          description: match.description,
          requirements: match.requirements || null,
          contactEmail: match.contactEmail || null,
          url: projectUrl,
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
});
