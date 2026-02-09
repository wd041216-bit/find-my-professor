import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { coverLetters, projectMatches, studentProfiles, activities } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
// Credits system removed
// const COVER_LETTER_COST = 10; // Removed

export const coverLetterRouter = router({
  /**
   * Generate a cover letter for a specific project match
   * Costs 10 credits
   */
  generate: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        tone: z.enum(["formal", "casual", "enthusiastic"]).default("formal"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { matchId, tone } = input;

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Credits check removed - feature is now free

      // Get the project match
      const match = await db
        .select()
        .from(projectMatches)
        .where(and(eq(projectMatches.id, matchId), eq(projectMatches.userId, userId)))
        .limit(1);

      if (match.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project match not found",
        });
      }

      const projectMatch = match[0];

      // Get user profile
      const profile = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, userId))
        .limit(1);

      // Get user activities
      const userActivities = await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.createdAt));

      // Build context for LLM
      const userProfile = profile[0] || {};
      const activitiesContext = userActivities
        .map(
          (act: typeof activities.$inferSelect) =>
            `- ${act.title} (${act.category}): ${act.description || "No description"}`
        )
        .join("\n");

      const toneInstructions = {
        formal: "Write in a formal, professional academic tone.",
        casual: "Write in a friendly but professional tone.",
        enthusiastic: "Write with enthusiasm and passion for the research.",
      };

      // Generate cover letter using LLM
      // IMPORTANT: Always generate in English regardless of user interface language
      const prompt = `You are an expert academic advisor helping a student write a compelling cover letter for a research position.

**CRITICAL INSTRUCTION: Write the entire cover letter in English only. The recipient is a foreign professor who expects English communication.**

**Student Profile:
- Current University: ${userProfile.currentUniversity || "Not specified"}
- Current Major: ${userProfile.currentMajor || "Not specified"}
- Academic Level: ${userProfile.academicLevel || "Not specified"}
- GPA: ${userProfile.gpa || "Not specified"}
- Skills: ${userProfile.skills ? JSON.parse(userProfile.skills).join(", ") : "Not specified"}
- Interests: ${userProfile.interests ? JSON.parse(userProfile.interests).join(", ") : "Not specified"}
- Bio: ${userProfile.bio || "Not specified"}

**Student Activities:**
${activitiesContext || "No activities listed"}

**Target Research Position:**
- Project: ${projectMatch.projectName}
- Professor: ${projectMatch.professorName}
- University: ${projectMatch.university}
- Research Direction: ${projectMatch.researchDirection}
- Description: ${projectMatch.description}
- Requirements: ${projectMatch.requirements || "Not specified"}

**Task:**
Write a personalized cover letter (approximately 300-400 words) for this student applying to this research position. ${toneInstructions[tone]}

**Guidelines:**
1. Start with a strong opening that shows genuine interest in the specific research
2. Highlight relevant skills and experiences from the student's activities
3. Explain why the student is a good fit for this specific project
4. Show knowledge of the professor's research area
5. End with a clear call to action
6. Use specific examples from the student's background
7. Keep it concise and focused

**Format:**
Return ONLY the cover letter text, without any additional commentary or meta-text. Do not include subject line or email headers.`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an expert academic advisor specializing in research position applications. Write compelling, personalized cover letters in English only. Never use Chinese or any other language.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const messageContent = response.choices[0]?.message?.content;
      const letterContent = typeof messageContent === 'string' ? messageContent : '';

      if (!letterContent) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate cover letter",
        });
      }

      // Save the cover letter to database
      const result = await db.insert(coverLetters).values({
        userId,
        matchId,
        projectName: projectMatch.projectName,
        professorName: projectMatch.professorName,
        university: projectMatch.university,
        content: letterContent,
        tone,
      });

      return {
        id: result[0].insertId,
        content: letterContent,
        projectName: projectMatch.projectName,
        professorName: projectMatch.professorName,
        university: projectMatch.university,
        tone,
      };
    }),

  /**
   * Get all cover letters for the current user
   */
  getMyLetters: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

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
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [letter] = await db
        .select()
        .from(coverLetters)
        .where(
          and(eq(coverLetters.id, input.id), eq(coverLetters.userId, ctx.user.id))
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
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db
        .delete(coverLetters)
        .where(
          and(eq(coverLetters.id, input.id), eq(coverLetters.userId, ctx.user.id))
        );

      return { success: true };
    }),
});
