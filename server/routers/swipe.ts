import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { studentLikes, studentSwipes, professors, studentProfiles } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getProfessorsForSwipe } from "../services/professorsService";
import { isMinimalProfile } from "../services/profileCompletenessService";
import { getCachedFilterOptions, setCachedFilterOptions, getCachedProfileCompleteness, setCachedProfileCompleteness } from "../services/cacheService";

/**
 * Swipe router - handles Tinder-style professor matching
 */
export const swipeRouter = router({
  /**
   * Get professors for swiping
   * Returns professors sorted by match score, excluding already swiped ones
   */
  /**
   * Get filter options (universities and departments)
   */
  getFilterOptions: protectedProcedure
    .query(async () => {
      // 检查缓存
      const cached = getCachedFilterOptions();
      if (cached) {
        return {
          universities: cached.universities,
          departments: cached.departments,
        };
      }
      
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Get unique universities
      const universities = await db
        .selectDistinct({ university: professors.universityName })
        .from(professors)
        .where(sql`${professors.universityName} IS NOT NULL AND ${professors.universityName} != ''`)
        .orderBy(professors.universityName);

      // Get unique departments
      const departments = await db
        .selectDistinct({ department: professors.department })
        .from(professors)
        .where(sql`${professors.department} IS NOT NULL AND ${professors.department} != ''`)
        .orderBy(professors.department);

      const result = {
        universities: universities.map((u) => u.university).filter((u): u is string => !!u),
        departments: departments.map((d) => d.department).filter((d): d is string => !!d),
      };
      
      // 缓存结果（5分钟）
      setCachedFilterOptions(result.universities, result.departments);
      
      return result;
    }),

  getProfessorsToSwipe: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        university: z.string().optional(),
        department: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Check if user profile is complete
      const profile = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, userId))
        .limit(1);

      if (!profile || profile.length === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Please complete your profile first",
        });
      }

      // Check if profile is minimal (only target university)
      const cached = getCachedProfileCompleteness(userId);
      const isMinimal = cached !== null ? cached : isMinimalProfile(profile[0]);
      
      if (cached === null) {
        setCachedProfileCompleteness(userId, isMinimal);
      }

      // Get already swiped professors
      const swipedProfessors = await db
        .select()
        .from(studentSwipes)
        .where(eq(studentSwipes.studentId, userId));

      const swipedIds = swipedProfessors.map((s) => s.professorId);
      console.log('[Swipe Router] Excluding', swipedIds.length, 'swiped professors');

      // Use real-time match score calculation
      const matchedProfessors = await getProfessorsForSwipe(
        userId,
        input.limit,
        swipedIds,
        input.offset,
        input.university,
        input.department
      );

      return {
        professors: matchedProfessors,
        hasMore: matchedProfessors.length === input.limit,
        isMinimalProfile: isMinimal,
      };
    }),

  /**
   * Record a swipe action
   */
  swipe: protectedProcedure
    .input(
      z.object({
        professorId: z.number(),
        liked: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Record swipe
      await db.insert(studentSwipes).values({
        studentId: ctx.user.id,
        professorId: input.professorId,
        action: input.liked ? 'like' : 'pass',
      });

      // If liked, also add to likes table
      if (input.liked) {
        await db.insert(studentLikes).values({
          studentId: ctx.user.id,
          professorId: input.professorId,
        });
      }

      return { success: true };
    }),

  /**
   * Get liked professors (favorites)
   */
  getLikedProfessors: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const liked = await db
      .select({
        professor: professors,
        createdAt: studentLikes.createdAt,
      })
      .from(studentLikes)
      .innerJoin(professors, eq(studentLikes.professorId, professors.id))
      .where(eq(studentLikes.studentId, ctx.user.id))
      .orderBy(desc(studentLikes.createdAt));

    return liked.map((l) => ({
      ...l.professor,
      likedAt: l.createdAt,
    }));
  }),

  /**
   * Unlike a professor (remove from favorites)
   */
  unlike: protectedProcedure
    .input(z.object({ professorId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await db
        .delete(studentLikes)
        .where(
          and(
            eq(studentLikes.studentId, ctx.user.id),
            eq(studentLikes.professorId, input.professorId)
          )
        );

      return { success: true };
    }),
});
