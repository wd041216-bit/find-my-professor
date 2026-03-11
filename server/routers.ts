import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { swipeRouter } from "./routers/swipe";
import { coverLetterRouter } from "./routers/coverLetter";
import { normalizeStudentTags } from "./services/tagNormalizationService";

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
          targetMajors: input.targetMajors && input.targetMajors.length > 0 ? JSON.stringify(input.targetMajors) : null,
          skills: input.skills && input.skills.length > 0 ? JSON.stringify(input.skills) : null,
          interests: input.interests && input.interests.length > 0 ? JSON.stringify(input.interests) : null,
          bio: input.bio || null,
        });
        
        // Asynchronously normalize student tags against professor vocabulary
        // This runs in the background and does NOT block the profile save response
        const skillsForNorm = input.skills && input.skills.length > 0 ? input.skills : [];
        const interestsForNorm = input.interests && input.interests.length > 0 ? input.interests : [];
        const majorsForNorm = input.targetMajors && input.targetMajors.length > 0 ? input.targetMajors : [];
        if (skillsForNorm.length > 0 || interestsForNorm.length > 0 || majorsForNorm.length > 0) {
          // Fire-and-forget: do not await, never throws to caller
          normalizeStudentTags(ctx.user.id, skillsForNorm, interestsForNorm, majorsForNorm, input.bio)
            .catch(err => console.error('[Profile] Tag normalization error (non-fatal):', err));
        }
        
        return result;
      }),

    parseResume: protectedProcedure
      .input(z.object({
        fileContent: z.string(), // base64 encoded file
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        console.log('[ParseResume] Starting resume parsing...');
        console.log('[ParseResume] File name:', input.fileName);
        console.log('[ParseResume] File content length:', input.fileContent.length);
        
        const { invokeLLM } = await import("./_core/llm");
        // pdf-parse v2 uses PDFParse class
        const { PDFParse } = await import('pdf-parse');
        const mammoth = await import('mammoth');
        
        // Extract file content from base64
        const base64Data = input.fileContent.split(',')[1];
        const fileBuffer = Buffer.from(base64Data, 'base64');
        
        // Convert PDF/DOCX to text using proper parsers
        let resumeText = '';
        console.log('[ParseResume] Extracting text from file...');
        try {
          if (input.fileName.endsWith('.pdf')) {
            // Use pdf-parse v2 for PDF files
            const parser = new PDFParse({ data: fileBuffer });
            const pdfData = await parser.getText();
            resumeText = pdfData.text;
            console.log('[ParseResume] PDF text extracted, length:', resumeText.length);
          } else if (input.fileName.endsWith('.docx')) {
            // Use mammoth for DOCX files
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            resumeText = result.value;
            console.log('[ParseResume] DOCX text extracted, length:', resumeText.length);
          } else {
            throw new Error('Unsupported file format. Please upload PDF or DOCX.');
          }
        } catch (parseError) {
          console.error('[ParseResume] File parsing error:', parseError);
          throw new Error('Failed to parse resume file. Please ensure it is a valid PDF or DOCX file.');
        }
        
        // Use LLM to parse resume
        console.log('[ParseResume] Calling LLM to parse resume...');
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
5. Activities (projects, internships, research experiences)

Resume content:
${resumeText.substring(0, 6000)}

Return ONLY a JSON object with this structure:
{
  "skills": ["skill1", "skill2", ...],
  "interests": ["interest1", "interest2", ...],
  "targetMajors": ["major1", "major2", ...],
  "gpa": "3.8" or null,
  "activities": [
    {
      "title": "Project/Internship/Research title",
      "category": "project" | "internship" | "research" | "competition" | "volunteer" | "leadership" | "other",
      "organization": "Organization name",
      "role": "Your role",
      "description": "Brief description",
      "startDate": "2024-01" or null,
      "endDate": "2024-12" or null,
      "isCurrent": true or false,
      "skills": ["skill1", "skill2"],
      "achievements": ["achievement1", "achievement2"]
    }
  ]
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
                  },
                  activities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        category: { 
                          type: 'string',
                          enum: ['project', 'internship', 'research', 'competition', 'volunteer', 'leadership', 'other']
                        },
                        organization: { type: ['string', 'null'] },
                        role: { type: ['string', 'null'] },
                        description: { type: ['string', 'null'] },
                        startDate: { type: ['string', 'null'] },
                        endDate: { type: ['string', 'null'] },
                        isCurrent: { type: 'boolean' },
                        skills: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        achievements: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      },
                      required: ['title', 'category', 'organization', 'role', 'description', 'startDate', 'endDate', 'isCurrent', 'skills', 'achievements'],
                      additionalProperties: false
                    },
                    description: 'List of activities (projects, internships, research)'
                  }
                },
                required: ['skills', 'interests', 'targetMajors', 'gpa', 'activities'],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = response.choices[0].message.content;
        console.log('[ParseResume] LLM response received');
        const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
        console.log('[ParseResume] Parsed data:', JSON.stringify(parsed, null, 2));
        console.log('[ParseResume] Skills count:', parsed.skills?.length || 0);
        console.log('[ParseResume] Activities count:', parsed.activities?.length || 0);
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
  
  activities: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserActivities(ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        category: z.enum(['research', 'volunteer', 'competition', 'internship', 'project', 'leadership', 'other']),
        organization: z.string().optional(),
        role: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isCurrent: z.boolean().default(false),
        skills: z.array(z.string()).default([]),
        achievements: z.array(z.string()).default([]),
        source: z.enum(['manual', 'resume_upload']).default('manual'),
      }))
      .mutation(async ({ ctx, input }) => {
        const activityData: any = {
          userId: ctx.user.id,
          title: input.title,
          category: input.category,
          organization: input.organization || null,
          role: input.role || null,
          description: input.description || null,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          isCurrent: input.isCurrent,
          skills: JSON.stringify(input.skills),
          achievements: JSON.stringify(input.achievements),
          source: input.source,
        };
        return db.createActivity(activityData);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        category: z.enum(['research', 'volunteer', 'competition', 'internship', 'project', 'leadership', 'other']).optional(),
        organization: z.string().optional(),
        role: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isCurrent: z.boolean().optional(),
        skills: z.array(z.string()).optional(),
        achievements: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        const activityUpdate: any = {};
        if (updateData.title) activityUpdate.title = updateData.title;
        if (updateData.category) activityUpdate.category = updateData.category;
        if (updateData.organization !== undefined) activityUpdate.organization = updateData.organization;
        if (updateData.role !== undefined) activityUpdate.role = updateData.role;
        if (updateData.description !== undefined) activityUpdate.description = updateData.description;
        if (updateData.startDate) activityUpdate.startDate = new Date(updateData.startDate);
        if (updateData.endDate) activityUpdate.endDate = new Date(updateData.endDate);
        if (updateData.isCurrent !== undefined) activityUpdate.isCurrent = updateData.isCurrent;
        if (updateData.skills) activityUpdate.skills = JSON.stringify(updateData.skills);
        if (updateData.achievements) activityUpdate.achievements = JSON.stringify(updateData.achievements);
        return db.updateActivity(id, activityUpdate);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteActivity(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
