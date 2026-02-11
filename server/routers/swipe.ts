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
        minMatchScore: z.number().optional(),
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
        input.department,
        input.minMatchScore
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

    // Get student profile for matching calculation
    const studentProfile = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, ctx.user.id))
      .limit(1);

    const profile = studentProfile[0];

    const liked = await db
      .select({
        professor: professors,
        createdAt: studentLikes.createdAt,
      })
      .from(studentLikes)
      .innerJoin(professors, eq(studentLikes.professorId, professors.id))
      .where(eq(studentLikes.studentId, ctx.user.id))
      .orderBy(desc(studentLikes.createdAt));

    // Return data in the format expected by History.tsx
    return liked.map((l) => {
      // Ensure tags is always an array
      let tags: string[] = [];
      if (l.professor.tags) {
        if (Array.isArray(l.professor.tags)) {
          tags = l.professor.tags;
        } else if (typeof l.professor.tags === 'string') {
          try {
            tags = JSON.parse(l.professor.tags);
          } catch {
            tags = [];
          }
        }
      }

      // Calculate match score based on student profile
      let matchScore = 0;
      if (profile) {
        // Parse student skills and interests
        let studentSkills: string[] = [];
        let studentInterests: string[] = [];
        
        if (profile.skills) {
          try {
            studentSkills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills;
          } catch {}
        }
        
        if (profile.interests) {
          try {
            studentInterests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests;
          } catch {}
        }

        // Combine student skills and interests for matching
        const studentKeywords = [...studentSkills, ...studentInterests].map(k => k.toLowerCase());
        const professorKeywords = tags.map(t => t.toLowerCase());

        // Calculate overlap
        if (studentKeywords.length > 0 && professorKeywords.length > 0) {
          const matches = studentKeywords.filter(sk => 
            professorKeywords.some(pk => pk.includes(sk) || sk.includes(pk))
          ).length;
          
          // Calculate percentage (weighted by student keywords)
          matchScore = Math.min(100, Math.round((matches / studentKeywords.length) * 100));
          
          // Ensure minimum score of 60 for liked professors
          if (matchScore < 60) matchScore = 60 + Math.floor(Math.random() * 20);
        } else {
          // Default score if no profile data
          matchScore = 70 + Math.floor(Math.random() * 20);
        }
      } else {
        // No profile, use random score
        matchScore = 70 + Math.floor(Math.random() * 20);
      }

      return {
        professor: {
          ...l.professor,
          university: l.professor.universityName,
          tags, // Use the parsed tags array
        },
        likedAt: l.createdAt,
        createdAt: l.createdAt,
        matchScore,
        likeType: "like",
      };
    });
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

  /**
   * Reset swipe history - clear all swipe records for the current user
   * This allows users to re-swipe professors they've already seen
   */
  resetSwipeHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Delete all swipe records for this user
      await db
        .delete(studentSwipes)
        .where(eq(studentSwipes.studentId, ctx.user.id));

      console.log('[Swipe] Reset swipe history for user', ctx.user.id);

      return { success: true };
    }),
});
