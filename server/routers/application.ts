import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";

export const applicationRouter = router({
  generateLetter: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get student profile and activities
      const profile = await db.getStudentProfile(ctx.user.id);
      const activities = await db.getUserActivities(ctx.user.id);
      
      // Get project, professor, and university details
      const project = await db.getResearchProjectById(input.projectId);
      if (!project) {
        throw new Error("Project not found");
      }
      
      const professor = await db.getProfessorById(project.professorId);
      const university = await db.getUniversityById(project.universityId);

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
        title: project.title,
        description: project.description,
        requirements: project.requirements ? JSON.parse(project.requirements) : [],
        researchAreas: project.researchAreas ? JSON.parse(project.researchAreas) : [],
        professor: {
          name: professor?.name,
          title: professor?.title,
          department: professor?.department,
          researchAreas: professor?.researchAreas ? JSON.parse(professor.researchAreas) : [],
          labName: professor?.labName,
        },
        university: {
          name: university?.name,
          country: university?.country,
        },
      };

      // Generate application letter using LLM
      const prompt = `You are an expert application letter writer for research positions. Write a compelling, personalized application letter for a student applying to a research project.

Student Profile:
${JSON.stringify(studentContext, null, 2)}

Research Project:
${JSON.stringify(projectContext, null, 2)}

Requirements:
1. Address the letter to ${professor?.name} (${professor?.title})
2. Express genuine interest in the specific research project
3. Highlight relevant skills and experiences from the student's activities
4. Connect the student's interests and goals with the research areas
5. Demonstrate knowledge of the professor's work and lab
6. Be professional, concise (300-400 words), and enthusiastic
7. Include specific examples from the student's background
8. End with a clear call to action

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
        projectId: input.projectId,
        content: generatedLetter,
      });

      return {
        success: true,
        letter: generatedLetter,
        historyId,
      };
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    // Get all application letters for the user across all projects
    const allProjects = await db.getAllResearchProjects();
    const history: any[] = [];
    
    for (const project of allProjects) {
      const letters = await db.getUserApplicationLetters(ctx.user.id, project.id);
      history.push(...letters);
    }
    
    const historyWithDetails = await Promise.all(
      history.map(async (item: any) => {
        const project = await db.getResearchProjectById(item.projectId);
        const professor = project ? await db.getProfessorById(project.professorId) : null;
        const university = project ? await db.getUniversityById(project.universityId) : null;
        
        return {
          ...item,
          project: project ? {
            title: project.title,
            professor: professor?.name,
            university: university?.name,
          } : null,
        };
      })
    );

    return historyWithDetails;
  }),

  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // Get application letter by finding it in user's history
      const allProjects = await db.getAllResearchProjects();
      let history: any = null;
      
      for (const project of allProjects) {
        const letters = await db.getUserApplicationLetters(ctx.user.id, project.id);
        history = letters.find((l: any) => l.id === input.id);
        if (history) break;
      }
      
      if (!history || history.userId !== ctx.user.id) {
        throw new Error("Application history not found");
      }

      const project = await db.getResearchProjectById(history.projectId);
      const professor = project ? await db.getProfessorById(project.professorId) : null;
      const university = project ? await db.getUniversityById(project.universityId) : null;

      return {
        ...history,
        project: project ? {
          ...project,
          requirements: project.requirements ? JSON.parse(project.requirements) : [],
          researchAreas: project.researchAreas ? JSON.parse(project.researchAreas) : [],
          majors: project.majors ? JSON.parse(project.majors) : [],
        } : null,
        professor: professor ? {
          ...professor,
          researchAreas: professor.researchAreas ? JSON.parse(professor.researchAreas) : [],
        } : null,
        university,
      };
    }),
});
