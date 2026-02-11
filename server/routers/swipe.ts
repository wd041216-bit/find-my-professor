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
   * Get filter options (universities and research fields)
   */
  getFilterOptions: protectedProcedure
    .query(async () => {
      // 检查缓存
      const cached = getCachedFilterOptions();
      if (cached) {
        return {
          universities: cached.universities,
          researchFields: cached.departments, // Reuse departments cache key for backward compatibility
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
        .where(sql`university_name IS NOT NULL AND university_name != ''`)
        .orderBy(sql`university_name`);

      // Get unique research fields
      const researchFields = await db
        .selectDistinct({ field: professors.research_field })
        .from(professors)
        .where(sql`${professors.research_field} IS NOT NULL AND ${professors.research_field} != ''`)
        .orderBy(professors.research_field);

      const result = {
        universities: universities.map((u) => u.university).filter((u): u is string => !!u),
        researchFields: researchFields.map((f) => f.field).filter((f): f is string => !!f),
      };
      
      // 缓存结果（5分钟）- reuse departments key for backward compatibility
      setCachedFilterOptions(result.universities, result.researchFields);
      
      return result;
    }),

  getProfessorsToSwipe: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        university: z.string().optional(),
        researchField: z.string().optional(),
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
        input.researchField,
        undefined // minMatchScore removed - no longer filter by match score
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

      // If liked, calculate match score and add to likes table
      if (input.liked) {
        // Get student profile for match score calculation
        const studentProfile = await db
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.userId, ctx.user.id))
          .limit(1);

        const profile = studentProfile[0];
        let matchScore = 0;

        if (profile) {
          // Get professor data
          const professor = await db
            .select()
            .from(professors)
            .where(eq(professors.id, input.professorId))
            .limit(1);

          if (professor.length > 0) {
            const prof = professor[0];
            const professorTags = (prof.tags as string[]) || [];
            
            // Calculate match score based on overlapping tags
            const studentSkills = profile.skills ? JSON.parse(profile.skills as string) : [];
            const studentInterests = profile.interests ? JSON.parse(profile.interests as string) : [];
            const studentTags = [...studentSkills, ...studentInterests].map(t => t.toLowerCase());
            
            const matchedTags = professorTags.filter(tag => 
              studentTags.some(st => st.includes(tag.toLowerCase()) || tag.toLowerCase().includes(st))
            );
            
            const totalTags = Math.max(professorTags.length, studentTags.length);
            matchScore = totalTags > 0 
              ? Math.round((matchedTags.length / totalTags) * 100)
              : 70; // Default score if no tags
            
            // Ensure match score is between 60-100
            matchScore = Math.max(60, Math.min(100, matchScore));
            
            console.log('[Swipe] Calculated match score:', matchScore, 'for professor:', input.professorId);
          }
        }

        // Insert like with match score
        await db.insert(studentLikes).values({
          studentId: ctx.user.id,
          professorId: input.professorId,
          matchScore, // Save calculated match score
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
        matchScore: studentLikes.matchScore, // Get saved match score
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

      // Use saved match score from database (calculated when user liked the professor)
      const matchScore = l.matchScore || 70; // Default to 70 if no score saved

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
