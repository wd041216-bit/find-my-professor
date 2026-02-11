import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { swipeRouter } from "./routers/swipe";
import { coverLetterRouter } from "./routers/coverLetter";

export const appRouter = router({
  system: systemRouter,
  
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


  swipe: swipeRouter,
  coverLetter: coverLetterRouter,
});

export type AppRouter = typeof appRouter;
