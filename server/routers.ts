import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { swipeRouter } from "./routers/swipe";
import { coverLetterRouter } from "./routers/coverLetter";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateTimezone: protectedProcedure
      .input(z.object({ timezone: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserTimezone(ctx.user.id, input.timezone);
        return { success: true };
      }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getStudentProfile(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        currentUniversity: z.string().optional(),
        currentMajor: z.string().optional(),
        academicLevel: z.enum(["high_school", "undergraduate", "graduate"]).optional(),
        gpa: z.string().optional(),
        targetUniversities: z.array(z.string()).optional(),
        targetMajors: z.array(z.string()).optional(),
        skills: z.array(z.string()).optional(),
        interests: z.array(z.string()).optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save raw input without normalization
        // Normalization will be performed during matching to avoid wasting tokens on multiple edits
        // Handle empty arrays - convert to null to avoid SQL errors
        const result = await db.upsertStudentProfile({
          userId: ctx.user.id,
          currentUniversity: input.currentUniversity || null,
          currentMajor: input.currentMajor || null,
          academicLevel: input.academicLevel || null,
          gpa: input.gpa || null,
          targetUniversities: input.targetUniversities && input.targetUniversities.length > 0 ? JSON.stringify(input.targetUniversities) : null,
          targetMajors: input.targetMajors && input.targetMajors.length > 0 ? JSON.stringify(input.targetMajors) : null,
          skills: input.skills && input.skills.length > 0 ? JSON.stringify(input.skills) : null,
          interests: input.interests && input.interests.length > 0 ? JSON.stringify(input.interests) : null,
          bio: input.bio || null,
        });
        
        // matchScore is now calculated in real-time during swipe
        
        return result;
      }),

    parseResume: protectedProcedure
      .input(z.object({
        fileContent: z.string(), // base64 encoded file
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        // Extract file content from base64
        const base64Data = input.fileContent.split(',')[1];
        const fileBuffer = Buffer.from(base64Data, 'base64');
        
        // Convert PDF/DOCX to text (simplified - in production use proper parsers)
        let resumeText = '';
        if (input.fileName.endsWith('.pdf')) {
          // For PDF, use a simple text extraction (in production use pdf-parse)
          resumeText = fileBuffer.toString('utf-8');
        } else if (input.fileName.endsWith('.docx')) {
          // For DOCX, use a simple text extraction (in production use mammoth)
          resumeText = fileBuffer.toString('utf-8');
        } else {
          throw new Error('Unsupported file format. Please upload PDF or DOCX.');
        }
        
        // Use LLM to parse resume
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a resume parser. Extract structured information from resumes and return JSON only.'
            },
            {
              role: 'user',
              content: `Parse the following resume and extract:
1. Skills (array of strings)
2. Research interests (array of strings)
3. Target majors/fields (array of strings)
4. GPA (string, if available)

Resume content:
${resumeText.substring(0, 4000)}

Return ONLY a JSON object with this structure:
{
  "skills": ["skill1", "skill2", ...],
  "interests": ["interest1", "interest2", ...],
  "targetMajors": ["major1", "major2", ...],
  "gpa": "3.8" or null
}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'resume_parse',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  skills: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of skills extracted from resume'
                  },
                  interests: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of research interests extracted from resume'
                  },
                  targetMajors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of target majors or fields'
                  },
                  gpa: {
                    type: ['string', 'null'],
                    description: 'GPA if available'
                  }
                },
                required: ['skills', 'interests', 'targetMajors', 'gpa'],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = response.choices[0].message.content;
        const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
        return parsed;
      }),
  }),

  professors: router({
    getByUniversity: publicProcedure
      .input(z.object({ universityName: z.string() }))
      .query(async ({ input }) => {
        return db.getProfessorsByUniversity(input.universityName);
      }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProfessorById(input.id);
      }),
  }),


  swipe: swipeRouter,
  coverLetter: coverLetterRouter,
});

export type AppRouter = typeof appRouter;
