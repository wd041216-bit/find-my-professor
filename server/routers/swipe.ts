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

      // Get unique research fields with Chinese names
      const researchFieldsRaw = await db.execute(
        sql`SELECT DISTINCT research_field, research_field_zh FROM professors WHERE research_field IS NOT NULL AND research_field != '' ORDER BY research_field`
      );
      const researchFieldRows = (researchFieldsRaw[0] as unknown as any[]);
      const researchFields = researchFieldRows.map((r: any) => r.research_field).filter(Boolean) as string[];
      const researchFieldsZh = researchFieldRows.map((r: any) => r.research_field_zh || r.research_field).filter(Boolean) as string[];

      // Get university names with Chinese names from UNIVERSITY_ZH mapping
      const UNIVERSITY_ZH: Record<string, string> = {
        "Brown University": "布朗大学",
        "California Institute of Technology": "加州理工学院",
        "Carnegie Mellon University": "卡内基梅隆大学",
        "Columbia University": "哥伦比亚大学",
        "Dartmouth College": "达特茅斯学院",
        "Duke University": "杜克大学",
        "Georgetown University": "乔治城大学",
        "Harvard University": "哈佛大学",
        "Johns Hopkins University": "约翰斯·霍普金斯大学",
        "Lehigh University": "里海大学",
        "MIT": "麻省理工学院",
        "Northeastern University": "东北大学",
        "Northwestern University": "西北大学",
        "Pepperdine University": "佩珀代因大学",
        "Princeton University": "普林斯顿大学",
        "Rice University": "莱斯大学",
        "Stanford University": "斯坦福大学",
        "University of California, Los Angeles": "加州大学洛杉矶分校",
        "University of California, Santa Barbara": "加州大学圣巴巴拉分校",
        "University of Chicago": "芝加哥大学",
        "University of Florida": "佛罗里达大学",
        "University of Miami": "迈阿密大学",
        "University of Michigan": "密歇根大学",
        "University of North Carolina at Chapel Hill": "北卡罗来纳大学教堂山分校",
        "University of Southern California": "南加州大学",
        "University of Virginia": "弗吉尼亚大学",
        "University of Washington": "华盛顿大学",
        "Villanova University": "维拉诺瓦大学",
        "Washington University in St. Louis": "圣路易斯华盛顿大学",
        "Yale University": "耶鲁大学",
      };

      const universitiesList = universities.map((u) => u.university).filter((u): u is string => !!u);
      const universitiesZh = universitiesList.map(u => UNIVERSITY_ZH[u] || u);

      const result = {
        universities: universitiesList,
        universitiesZh,
        researchFields,
        researchFieldsZh,
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
        let matchScore: number | null = null;

        // Always fetch professor data for score calculation
        const professorRows = await db
          .select()
          .from(professors)
          .where(eq(professors.id, input.professorId))
          .limit(1);

        if (professorRows.length > 0) {
          const prof = professorRows[0];

          // Parse professor tags (handle both string and array formats)
          let professorTags: string[] = [];
          if (prof.tags) {
            if (Array.isArray(prof.tags)) {
              professorTags = prof.tags as string[];
            } else if (typeof prof.tags === 'string') {
              try {
                const parsed = JSON.parse(prof.tags as string);
                professorTags = Array.isArray(parsed) ? parsed : (prof.tags as string).split(',').map((t: string) => t.trim());
              } catch {
                professorTags = (prof.tags as string).split(',').map((t: string) => t.trim());
              }
            }
          }

          if (profile) {
            // User has a profile — calculate based on tag overlap
            const studentSkills = profile.skills ? JSON.parse(profile.skills as string) : [];
            const studentInterests = profile.interests ? JSON.parse(profile.interests as string) : [];
            const studentTags = [...studentSkills, ...studentInterests].map((t: string) => t.toLowerCase());

            const matchedTags = professorTags.filter(tag => {
              const tagLower = tag.toLowerCase();
              return studentTags.some((st: string) => {
                const stLower = st.toLowerCase();
                if (tagLower.length < 3 || stLower.length < 3) return tagLower === stLower;
                return stLower.includes(tagLower) || tagLower.includes(stLower);
              });
            });

            const totalTags = Math.max(professorTags.length, studentTags.length, 1);
            if (matchedTags.length > 0) {
              matchScore = Math.round((matchedTags.length / totalTags) * 100);
              const randomVariation = Math.floor(Math.random() * 11) - 5;
              matchScore = Math.max(60, Math.min(100, matchScore + randomVariation));
            } else {
              // No tag overlap — give a baseline exploratory score (55–75)
              matchScore = 55 + Math.floor(Math.random() * 21);
            }
          } else {
            // No profile — generate a plausible score based on professor tag richness
            // More tags = more potential for match; base range 60–85
            const tagBonus = Math.min(professorTags.length * 2, 20);
            matchScore = 60 + tagBonus + Math.floor(Math.random() * 6);
            matchScore = Math.min(matchScore, 85);
          }

          console.log('[Swipe] Calculated match score:', matchScore, 'for professor:', input.professorId, '(profile:', !!profile, ')');
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
      // If null, it means no match (different research area)
      const matchScore = l.matchScore; // Keep null if no match

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
