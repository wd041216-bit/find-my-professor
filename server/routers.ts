import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { coverLetterRouter } from "./routers/coverLetter";
import { swipeRouter } from "./routers/swipe";
import { NormalizationService } from "./services/normalization";
import { ScrapingService } from "./services/scraping";

export const appRouter = router({
  system: systemRouter,
  
  // Scraping and caching system
  scraping: router({
    // Search with on-demand scraping
    searchProjects: protectedProcedure
      .input(z.object({
        universityName: z.string(),
        majorName: z.string(),
        degreeLevel: z.enum(["all", "undergraduate", "graduate"]).default("all"),
      }))
      .query(async ({ ctx, input }) => {
        // Step 1: Check cache
        const cached = await ScrapingService.getCachedProjects(
          input.universityName,
          input.majorName,
          input.degreeLevel
        );
        
        if (cached.cached && cached.projects.length > 0) {
          console.log(`[API] Returning ${cached.projects.length} cached projects (age: ${cached.cacheAge} days)`);
          return {
            projects: cached.projects,
            cached: true,
            cacheAge: cached.cacheAge,
            scrapingTriggered: false
          };
        }
        
        // Step 2: No cache or expired - trigger scraping
        console.log(`[API] No cache found, triggering scraping task`);
        const task = await ScrapingService.triggerScrapingTask(
          input.universityName,
          input.majorName,
          input.degreeLevel,
          ctx.user.id
        );
        
        // Step 3: Return empty array with task info
        return {
          projects: [],
          cached: false,
          scrapingTriggered: true,
          taskId: task.taskId,
          taskStatus: task.status,
          message: "Scraping task triggered. Please check back in a few moments."
        };
      }),
    
    // Get scraping task status
    getTaskStatus: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return ScrapingService.getTaskStatus(input.taskId);
      }),
    
    // Get cache statistics
    getCacheStats: protectedProcedure.query(async () => {
      return NormalizationService.getCacheStats();
    }),
  }),
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateTimezone: protectedProcedure
      .input(z.object({ timezone: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserTimezone(ctx.user.id, input.timezone);
        return { success: true };
      }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getStudentProfile(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        currentUniversity: z.string().optional(),
        currentMajor: z.string().optional(),
        academicLevel: z.enum(["high_school", "undergraduate", "graduate"]).optional(),
        gpa: z.string().optional(),
        targetUniversities: z.array(z.string()).optional(),
        targetMajors: z.array(z.string()).optional(),
        skills: z.array(z.string()).optional(),
        interests: z.array(z.string()).optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save raw input without normalization
        // Normalization will be performed during matching to avoid wasting tokens on multiple edits
        // Handle empty arrays - convert to null to avoid SQL errors
        const result = await db.upsertStudentProfile({
          userId: ctx.user.id,
          currentUniversity: input.currentUniversity || null,
          currentMajor: input.currentMajor || null,
          academicLevel: input.academicLevel || null,
          gpa: input.gpa || null,
          targetUniversities: input.targetUniversities && input.targetUniversities.length > 0 ? JSON.stringify(input.targetUniversities) : null,
          targetMajors: input.targetMajors && input.targetMajors.length > 0 ? JSON.stringify(input.targetMajors) : null,
          skills: input.skills && input.skills.length > 0 ? JSON.stringify(input.skills) : null,
          interests: input.interests && input.interests.length > 0 ? JSON.stringify(input.interests) : null,
          bio: input.bio || null,
        });
        
        // matchScore is now calculated in real-time during swipe
        
        return result;
      }),
  }),

  universities: router({
    list: publicProcedure.query(async () => {
      return db.getAllUniversities();
    }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUniversityById(input.id);
      }),
  }),

  professors: router({
    getByUniversity: publicProcedure
      .input(z.object({ universityName: z.string() }))
      .query(async ({ input }) => {
        return db.getProfessorsByUniversity(input.universityName);
      }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProfessorById(input.id);
      }),
  }),

  matches: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserMatches(ctx.user.id);
    }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        viewed: z.boolean().optional(),
        saved: z.boolean().optional(),
        applied: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateMatchStatus(id, updates);
        return { success: true };
      }),
  }),

  coverLetter: coverLetterRouter,
  swipe: swipeRouter,
});

export type AppRouter = typeof appRouter;
