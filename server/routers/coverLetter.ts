import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { coverLetters, studentProfiles, professors, studentLikes } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const coverLetterRouter = router({
  /**
   * Generate a cover letter for a liked professor
   */
  generateForProfessor: protectedProcedure
    .input(
      z.object({
        professorId: z.number(),
        tone: z.enum(["formal", "casual", "enthusiastic"]).default("formal"),
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

      // Get professor details
      const [professor] = await db
        .select()
        .from(professors)
        .where(eq(professors.id, input.professorId))
        .limit(1);

      if (!professor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Professor not found",
        });
      }

      // Get student profile
      const [profile] = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, ctx.user.id))
        .limit(1);

      if (!profile) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please complete your profile first",
        });
      }

      // Parse professor tags
      let professorTags: string[] = [];
      if (professor.tags) {
        try {
          professorTags = typeof professor.tags === 'string' ? JSON.parse(professor.tags) : professor.tags;
        } catch {}
      }

      // Parse student data
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

      // Generate cover letter using LLM
      const prompt = `You are an expert academic advisor helping a student write a compelling research interest letter to a professor.

Student Information:
- Name: ${ctx.user.name || "Student"}
- Current University: ${profile.currentUniversity || "N/A"}
- Major: ${profile.currentMajor || "N/A"}
- Academic Level: ${profile.academicLevel || "N/A"}
- GPA: ${profile.gpa || "N/A"}
- Skills: ${studentSkills.join(", ") || "N/A"}
- Research Interests: ${studentInterests.join(", ") || "N/A"}
- Bio: ${profile.bio || "N/A"}

Professor Information:
- Name: ${professor.name}
- University: ${professor.universityName}
- Department: ${professor.department || "N/A"}
- Research Field: ${professor.research_field || "N/A"}
- Research Interests: ${professorTags.join(", ") || "N/A"}

Task: Write a ${input.tone} research interest letter (around 300-400 words) from the student to the professor. The letter should:
1. Express genuine interest in the professor's research
2. Highlight relevant skills and experiences from the student's background
3. Explain why the student is a good fit for the professor's lab
4. Be professional yet personable
5. End with a clear call to action

Tone: ${input.tone === "formal" ? "Professional and academic" : input.tone === "casual" ? "Friendly but respectful" : "Enthusiastic and passionate"}

Write ONLY the letter content, no subject line or additional commentary.`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an expert academic advisor. Write compelling, personalized research interest letters.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const messageContent = response.choices[0]?.message?.content;
      const content = typeof messageContent === 'string' ? messageContent : "";

      if (!content) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate cover letter",
        });
      }

      // Save to database
      const insertResult = await db
        .insert(coverLetters)
        .values({
          userId: ctx.user.id,
          matchId: null, // No match_id for professor-based letters
          projectName: professor.research_field || "Research Opportunity",
          professorName: professor.name,
          university: professor.universityName,
          content,
          tone: input.tone,
        });

      const letterId = insertResult[0]?.insertId || 0;

      return {
        id: letterId,
        content,
        professorName: professor.name,
        university: professor.universityName,
        projectName: professor.research_field || "Research Opportunity",
      };
    }),

  /**
   * Get all cover letters for the current user
   */
  getMyLetters: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const letters = await db
      .select()
      .from(coverLetters)
      .where(eq(coverLetters.userId, ctx.user.id))
      .orderBy(desc(coverLetters.createdAt));

    return letters;
  }),

  /**
   * Get a specific cover letter by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const [letter] = await db
        .select()
        .from(coverLetters)
        .where(
          and(
            eq(coverLetters.id, input.id),
            eq(coverLetters.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!letter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cover letter not found",
        });
      }

      // Mark as viewed
      await db
        .update(coverLetters)
        .set({ viewed: true })
        .where(eq(coverLetters.id, input.id));

      return letter;
    }),

  /**
   * Delete a cover letter
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Verify ownership
      const [letter] = await db
        .select()
        .from(coverLetters)
        .where(
          and(
            eq(coverLetters.id, input.id),
            eq(coverLetters.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!letter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cover letter not found",
        });
      }

      await db.delete(coverLetters).where(eq(coverLetters.id, input.id));

      return { success: true };
    }),

  /**
   * Mark a cover letter as downloaded
   */
  markDownloaded: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await db
        .update(coverLetters)
        .set({ downloaded: true })
        .where(
          and(
            eq(coverLetters.id, input.id),
            eq(coverLetters.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),
});
