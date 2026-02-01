import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import axios from "axios";

export const resumeRouter = router({
  uploadAndParse: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileContent: z.string(), // base64 encoded file content
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is admin (admins don't consume credits)
        const isAdmin = ctx.user.role === "admin";
        
        // For non-admin users, check credit balance (estimated cost: 50 credits)
        const estimatedCost = 50;
        if (!isAdmin) {
          const userCredits = await db.getUserCredits(ctx.user.id);
          if (!userCredits || userCredits.balance < estimatedCost) {
            throw new Error("Insufficient credits. Please purchase more credits to use this feature.");
          }
        }
        
        // Upload file to S3
        const { storagePut } = await import("../storage");
        const fileBuffer = Buffer.from(input.fileContent, "base64");
        const fileExtension = input.fileName.split(".").pop()?.toLowerCase();
        const fileKey = `resumes/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        
        const { url: fileUrl } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        // Use LLM with file content to extract structured information
        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert resume parser. Extract structured information from resumes including activities, experiences, skills, and achievements. Return the data in JSON format.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please analyze this resume and extract all activities, experiences, skills, and achievements. For each activity, provide: title, category (research/volunteer/competition/internship/project/leadership/other), organization, role, description, start date, end date, skills used, and achievements. Return as JSON.",
                },
                {
                  type: "file_url",
                  file_url: {
                    url: fileUrl,
                    mime_type: input.mimeType as "application/pdf",
                  },
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "resume_data",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  activities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        category: {
                          type: "string",
                          enum: ["research", "volunteer", "competition", "internship", "project", "leadership", "other"],
                        },
                        organization: { type: "string" },
                        role: { type: "string" },
                        description: { type: "string" },
                        startDate: { type: "string" },
                        endDate: { type: "string" },
                        isCurrent: { type: "boolean" },
                        skills: {
                          type: "array",
                          items: { type: "string" },
                        },
                        achievements: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["title", "category"],
                      additionalProperties: false,
                    },
                  },
                  skills: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["activities", "skills"],
                additionalProperties: false,
              },
            },
          },
        });

        // Validate LLM response
        console.log("LLM Response:", JSON.stringify(llmResponse, null, 2));
        
        if (!llmResponse || !llmResponse.choices || llmResponse.choices.length === 0) {
          console.error("Invalid LLM response structure:", llmResponse);
          throw new Error("Invalid response from AI service. Please try again.");
        }
        
        const content = llmResponse.choices[0]?.message?.content;
        if (!content) {
          console.error("No content in LLM response:", llmResponse.choices[0]);
          throw new Error("AI service returned empty response. Please try again.");
        }

        const contentStr = typeof content === "string" ? content : JSON.stringify(content);
        let parsedData;
        try {
          parsedData = JSON.parse(contentStr);
        } catch (parseError) {
          console.error("Failed to parse LLM response:", contentStr);
          throw new Error("Failed to parse AI response. Please try again.");
        }
        
        // Validate parsed data structure
        if (!parsedData || !Array.isArray(parsedData.activities) || !Array.isArray(parsedData.skills)) {
          console.error("Invalid parsed data structure:", parsedData);
          throw new Error("AI returned invalid data format. Please try again.");
        }

        // Save activities to database
        const savedActivities = [];
        for (const activity of parsedData.activities) {
          const activityId = await db.createActivity({
            userId: ctx.user.id,
            title: activity.title,
            category: activity.category,
            organization: activity.organization || null,
            role: activity.role || null,
            description: activity.description || null,
            startDate: activity.startDate ? new Date(activity.startDate) : null,
            endDate: activity.endDate ? new Date(activity.endDate) : null,
            isCurrent: activity.isCurrent || false,
            skills: activity.skills && activity.skills.length > 0 ? JSON.stringify(activity.skills) : null,
            achievements: activity.achievements && activity.achievements.length > 0 ? JSON.stringify(activity.achievements) : null,
            source: "resume_upload",
          });
          savedActivities.push(activityId);
        }

        // Update user profile with extracted skills
        const currentProfile = await db.getStudentProfile(ctx.user.id);
        if (currentProfile && parsedData.skills && parsedData.skills.length > 0) {
          const existingSkills = currentProfile.skills ? JSON.parse(currentProfile.skills) : [];
          const mergedSkills = Array.from(new Set([...existingSkills, ...parsedData.skills]));
          
          await db.upsertStudentProfile({
            userId: ctx.user.id,
            skills: JSON.stringify(mergedSkills),
          });
        }
        
        // Deduct credits for non-admin users
        if (!isAdmin) {
          await db.updateUserCreditsBalance(
            ctx.user.id,
            -estimatedCost,
            "consumption",
            "Resume parsing with AI"
          );
        }

        return {
          success: true,
          activitiesCreated: savedActivities.length,
          skillsExtracted: parsedData.skills.length,
          activities: parsedData.activities,
        };
      } catch (error) {
        console.error("Resume parsing error:", error);
        throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
  parse: protectedProcedure
    .input(z.object({
      fileUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is admin (admins don't consume credits)
        const isAdmin = ctx.user.role === "admin";
        
        // For non-admin users, check credit balance (estimated cost: 50 credits)
        const estimatedCost = 50;
        if (!isAdmin) {
          const userCredits = await db.getUserCredits(ctx.user.id);
          if (!userCredits || userCredits.balance < estimatedCost) {
            throw new Error("Insufficient credits. Please purchase more credits to use this feature.");
          }
        }
        
        // Download file content
        const response = await axios.get(input.fileUrl, {
          responseType: "arraybuffer",
        });
        
        const fileBuffer = Buffer.from(response.data);
        const fileExtension = input.fileUrl.split(".").pop()?.toLowerCase();
        
        // Determine MIME type
        let mimeType = "application/pdf";
        if (fileExtension === "doc" || fileExtension === "docx") {
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        // Use LLM with file content to extract structured information
        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert resume parser. Extract structured information from resumes including activities, experiences, skills, and achievements. Return the data in JSON format.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please analyze this resume and extract all activities, experiences, skills, and achievements. For each activity, provide: title, category (research/volunteer/competition/internship/project/leadership/other), organization, role, description, start date, end date, skills used, and achievements. Return as JSON.",
                },
                {
                  type: "file_url",
                  file_url: {
                    url: input.fileUrl,
                    mime_type: mimeType as "application/pdf",
                  },
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "resume_data",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  activities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        category: {
                          type: "string",
                          enum: ["research", "volunteer", "competition", "internship", "project", "leadership", "other"],
                        },
                        organization: { type: "string" },
                        role: { type: "string" },
                        description: { type: "string" },
                        startDate: { type: "string" },
                        endDate: { type: "string" },
                        isCurrent: { type: "boolean" },
                        skills: {
                          type: "array",
                          items: { type: "string" },
                        },
                        achievements: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["title", "category"],
                      additionalProperties: false,
                    },
                  },
                  skills: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["activities", "skills"],
                additionalProperties: false,
              },
            },
          },
        });

        // Validate LLM response
        console.log("LLM Response:", JSON.stringify(llmResponse, null, 2));
        
        if (!llmResponse || !llmResponse.choices || llmResponse.choices.length === 0) {
          console.error("Invalid LLM response structure:", llmResponse);
          throw new Error("Invalid response from AI service. Please try again.");
        }
        
        const content = llmResponse.choices[0]?.message?.content;
        if (!content) {
          console.error("No content in LLM response:", llmResponse.choices[0]);
          throw new Error("AI service returned empty response. Please try again.");
        }

        const contentStr = typeof content === "string" ? content : JSON.stringify(content);
        let parsedData;
        try {
          parsedData = JSON.parse(contentStr);
        } catch (parseError) {
          console.error("Failed to parse LLM response:", contentStr);
          throw new Error("Failed to parse AI response. Please try again.");
        }
        
        // Validate parsed data structure
        if (!parsedData || !Array.isArray(parsedData.activities) || !Array.isArray(parsedData.skills)) {
          console.error("Invalid parsed data structure:", parsedData);
          throw new Error("AI returned invalid data format. Please try again.");
        }

        // Save activities to database
        const savedActivities = [];
        for (const activity of parsedData.activities) {
          const activityId = await db.createActivity({
            userId: ctx.user.id,
            title: activity.title,
            category: activity.category,
            organization: activity.organization || null,
            role: activity.role || null,
            description: activity.description || null,
            startDate: activity.startDate ? new Date(activity.startDate) : null,
            endDate: activity.endDate ? new Date(activity.endDate) : null,
            isCurrent: activity.isCurrent || false,
            skills: activity.skills && activity.skills.length > 0 ? JSON.stringify(activity.skills) : null,
            achievements: activity.achievements && activity.achievements.length > 0 ? JSON.stringify(activity.achievements) : null,
            source: "resume_upload",
          });
          savedActivities.push(activityId);
        }

        // Update user profile with extracted skills
        const currentProfile = await db.getStudentProfile(ctx.user.id);
        if (currentProfile && parsedData.skills && parsedData.skills.length > 0) {
          const existingSkills = currentProfile.skills ? JSON.parse(currentProfile.skills) : [];
          const mergedSkills = Array.from(new Set([...existingSkills, ...parsedData.skills]));
          
          await db.upsertStudentProfile({
            userId: ctx.user.id,
            skills: JSON.stringify(mergedSkills),
          });
        }
        
        // Deduct credits for non-admin users
        if (!isAdmin) {
          await db.updateUserCreditsBalance(
            ctx.user.id,
            -estimatedCost,
            "consumption",
            "Resume parsing with AI"
          );
        }

        return {
          success: true,
          activitiesCreated: savedActivities.length,
          skillsExtracted: parsedData.skills.length,
          activities: parsedData.activities,
        };
      } catch (error) {
        console.error("Resume parsing error:", error);
        throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
