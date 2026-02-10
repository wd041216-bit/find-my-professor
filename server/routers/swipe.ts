import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { studentLikes, studentSwipes, professors, studentProfiles } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getProfessorsForSwipe } from "../services/professorsService";
import { isMinimalProfile } from "../services/profileCompletenessService";

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

      return {
        universities: universities.map((u) => u.university).filter(Boolean),
        departments: departments.map((d) => d.department).filter(Boolean),
      };
    }),

  /**
   * Get departments for a specific university
   */
  getDepartmentsByUniversity: protectedProcedure
    .input(z.object({
      university: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const departments = await db
        .selectDistinct({ department: professors.department })
        .from(professors)
        .where(
          and(
            eq(professors.universityName, input.university),
            sql`${professors.department} IS NOT NULL AND ${professors.department} != ''`
          )
        )
        .orderBy(professors.department);

      return departments.map((d) => d.department).filter(Boolean);
    }),

  getProfessorsToSwipe: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      university: z.string().optional(),
      department: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      const userId = ctx.user.id;

      // Get student profile to check if it's minimal
      const profile = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, userId))
        .limit(1);
      
      const isMinimal = profile.length > 0 ? isMinimalProfile(profile[0]) : true;

      // Get list of already swiped professor IDs
      const swipedProfessors = await db
        .select({ professorId: studentSwipes.professorId })
        .from(studentSwipes)
        .where(eq(studentSwipes.studentId, userId));

      const swipedIds = swipedProfessors.map((s) => s.professorId);

      // Get professors for this user (with match scores)
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
    .input(z.object({
      professorId: z.number(),
      action: z.enum(["pass", "like", "super_like"]),
      matchScore: z.number().optional(), // Match score at the time of swiping
    }))
    .mutation(async (opts) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      const userId = ctx.user.id;

      // Check if professor exists
      const professor = await db
        .select()
        .from(professors)
        .where(eq(professors.id, input.professorId))
        .limit(1);

      if (professor.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Professor not found",
        });
      }

      // Record swipe
      await db.insert(studentSwipes).values({
        studentId: userId,
        professorId: input.professorId,
        action: input.action,
      }).onDuplicateKeyUpdate({
        set: {
          action: input.action,
        },
      });

      // If like or super_like, also add to likes table
      if (input.action === "like" || input.action === "super_like") {
        await db.insert(studentLikes).values({
          studentId: userId,
          professorId: input.professorId,
          likeType: input.action,
          matchScore: input.matchScore || null,
        }).onDuplicateKeyUpdate({
          set: {
            likeType: input.action,
            matchScore: input.matchScore || null,
          },
        });
      }

      return { success: true };
    }),

  /**
   * Get user's liked professors (My Matches)
   */
  getMyMatches: protectedProcedure
    .query(async (opts) => {
      const { ctx } = opts;
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      const userId = ctx.user.id;

      const likes = await db
        .select({
          id: studentLikes.id,
          likeType: studentLikes.likeType,
          createdAt: studentLikes.createdAt,
          matchScore: studentLikes.matchScore,
          professor: professors,
        })
        .from(studentLikes)
        .innerJoin(professors, eq(studentLikes.professorId, professors.id))
        .where(eq(studentLikes.studentId, userId))
        .orderBy(desc(studentLikes.createdAt));

      return likes;
    }),

  /**
   * Remove a professor from likes
   */
  unlikeProfessor: protectedProcedure
    .input(z.object({
      professorId: z.number(),
    }))
    .mutation(async (opts) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      const userId = ctx.user.id;

      await db
        .delete(studentLikes)
        .where(
          and(
            eq(studentLikes.studentId, userId),
            eq(studentLikes.professorId, input.professorId)
          )
        );

      return { success: true };
    }),
});
