import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { studentLikes, studentSwipes, professors } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { getProfessorsForSwipe } from "../services/professorsService";

/**
 * Swipe router - handles Tinder-style professor matching
 */
export const swipeRouter = router({
  /**
   * Get professors for swiping
   * Returns professors sorted by match score, excluding already swiped ones
   */
  getProfessorsToSwipe: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
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

      // Get list of already swiped professor IDs
      const swipedProfessors = await db
        .select({ professorId: studentSwipes.professorId })
        .from(studentSwipes)
        .where(eq(studentSwipes.studentId, userId));

      const swipedIds = swipedProfessors.map((s) => s.professorId);

      // Get professors for this user (with match scores)
      const matchedProfessors = await getProfessorsForSwipe(userId, input.limit, swipedIds);

      return {
        professors: matchedProfessors,
        hasMore: matchedProfessors.length === input.limit,
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
