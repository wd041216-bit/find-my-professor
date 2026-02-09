import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";

export const applicationRouter = router({
  generateLetter: protectedProcedure
    .input(z.object({
      projectId: z.number(), // This is actually matchId from project_matches table
    }))
    .mutation(async ({ ctx, input }) => {
      // Credits system removed - feature is now free
      
      // Get student profile and activities
      const profile = await db.getStudentProfile(ctx.user.id);
      const activities = await db.getUserActivities(ctx.user.id);
      
      // Get project match details (contains all project information)
      const match = await db.getMatchById(input.projectId);
      if (!match || match.userId !== ctx.user.id) {
        throw new Error("Project match not found");
      }

      // Prepare context for LLM
      const studentContext = {
        name: ctx.user.name,
        email: ctx.user.email,
        currentUniversity: profile?.currentUniversity,
        currentMajor: profile?.currentMajor,
        academicLevel: profile?.academicLevel,
        gpa: profile?.gpa,
        targetUniversities: profile?.targetUniversities ? JSON.parse(profile.targetUniversities) : [],
        targetMajors: profile?.targetMajors ? JSON.parse(profile.targetMajors) : [],
        skills: profile?.skills ? JSON.parse(profile.skills) : [],
        interests: profile?.interests ? JSON.parse(profile.interests) : [],
        activities: activities.map(a => ({
          title: a.title,
          category: a.category,
          organization: a.organization,
          role: a.role,
          description: a.description,
          skills: a.skills ? JSON.parse(a.skills) : [],
          achievements: a.achievements ? JSON.parse(a.achievements) : [],
        })),
      };

      const projectContext = {
        title: match.projectName,
        description: match.description,
        requirements: match.requirements || "",
        researchDirection: match.researchDirection,
        professor: {
          name: match.professorName,
          lab: match.lab,
        },
        university: match.university,
        major: match.major,
      };

      // Generate application letter using LLM
      const prompt = `You are an expert application letter writer for research positions. Write a compelling, personalized application letter for a student applying to a research project.

Student Profile:
${JSON.stringify(studentContext, null, 2)}

Research Project:
${JSON.stringify(projectContext, null, 2)}

Requirements:
1. Address the letter to ${match.professorName}
2. Express genuine interest in the specific research project
3. Highlight relevant skills and experiences from the student's activities
4. Connect the student's interests and goals with the research areas
5. Demonstrate knowledge of the professor's work and lab
6. Be professional, concise (300-400 words), and enthusiastic
7. Include specific examples from the student's background
8. End with a clear call to action
9. Write the letter in English (this is for applying to foreign professors)

Write a complete, ready-to-send application letter in professional format.`;

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an expert at writing compelling research application letters that highlight student strengths and align with research opportunities.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const generatedLetter = llmResponse.choices[0]?.message?.content;
      if (!generatedLetter || typeof generatedLetter !== "string") {
        throw new Error("Failed to generate application letter");
      }

      // Save to application history
      const historyId = await db.createApplicationLetter({
        userId: ctx.user.id,
        projectId: input.projectId, // This is matchId
        content: generatedLetter,
      });
      
      // Credits deduction removed - feature is now free

      return {
        success: true,
        letter: generatedLetter,
        historyId,
      };
    }),
});
