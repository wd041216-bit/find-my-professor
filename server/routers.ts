import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { resumeRouter } from "./routers/resume";
import { matchingRouter } from "./routers/matching";
import { applicationRouter } from "./routers/application";
import { creditsRouter } from "./routers/credits";

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
        return db.upsertStudentProfile({
          userId: ctx.user.id,
          currentUniversity: input.currentUniversity,
          currentMajor: input.currentMajor,
          academicLevel: input.academicLevel,
          gpa: input.gpa,
          targetUniversities: input.targetUniversities ? JSON.stringify(input.targetUniversities) : null,
          targetMajors: input.targetMajors ? JSON.stringify(input.targetMajors) : null,
          skills: input.skills ? JSON.stringify(input.skills) : null,
          interests: input.interests ? JSON.stringify(input.interests) : null,
          bio: input.bio,
        });
      }),
  }),

  activities: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const activities = await db.getUserActivities(ctx.user.id);
      return activities.map(activity => ({
        ...activity,
        skills: activity.skills ? JSON.parse(activity.skills) : [],
        achievements: activity.achievements ? JSON.parse(activity.achievements) : [],
      }));
    }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        category: z.enum(["research", "volunteer", "competition", "internship", "project", "leadership", "other"]),
        organization: z.string().optional(),
        role: z.string().optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isCurrent: z.boolean().optional(),
        skills: z.array(z.string()).optional(),
        achievements: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createActivity({
          userId: ctx.user.id,
          title: input.title,
          category: input.category,
          organization: input.organization,
          role: input.role,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
          isCurrent: input.isCurrent,
          skills: input.skills ? JSON.stringify(input.skills) : null,
          achievements: input.achievements ? JSON.stringify(input.achievements) : null,
          source: "manual",
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        category: z.enum(["research", "volunteer", "competition", "internship", "project", "leadership", "other"]).optional(),
        organization: z.string().optional(),
        role: z.string().optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isCurrent: z.boolean().optional(),
        skills: z.array(z.string()).optional(),
        achievements: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return db.updateActivity(id, {
          ...updates,
          skills: updates.skills ? JSON.stringify(updates.skills) : undefined,
          achievements: updates.achievements ? JSON.stringify(updates.achievements) : undefined,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteActivity(input.id);
        return { success: true };
      }),
  }),

  universities: router({
    list: publicProcedure.query(async () => {
      return db.getAllUniversities();
    }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUniversityById(input.id);
      }),
  }),

  professors: router({
    getByUniversity: publicProcedure
      .input(z.object({ universityId: z.number() }))
      .query(async ({ input }) => {
        return db.getProfessorsByUniversity(input.universityId);
      }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProfessorById(input.id);
      }),
  }),

  projects: router({
    list: publicProcedure.query(async () => {
      return db.getAllResearchProjects();
    }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getResearchProjectById(input.id);
      }),
    
    search: publicProcedure
      .input(z.object({
        universityIds: z.array(z.number()).optional(),
        majors: z.array(z.string()).optional(),
        researchAreas: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        return db.searchResearchProjects(input);
      }),
  }),

  matches: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserMatches(ctx.user.id);
    }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        viewed: z.boolean().optional(),
        saved: z.boolean().optional(),
        applied: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateMatchStatus(id, updates);
        return { success: true };
      }),
  }),

  resume: resumeRouter,
  matching: matchingRouter,
  application: applicationRouter,
  credits: creditsRouter,

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserNotifications(ctx.user.id);
    }),
    
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),
  }),

  contact: router({
    // Send a message to admin
    send: protectedProcedure
      .input(z.object({
        messageType: z.enum(["business", "support"]).default("support"),
        subject: z.string().min(1, "Subject is required"),
        message: z.string().min(1, "Message is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const messageId = await db.createContactMessage({
          userId: ctx.user.id,
          messageType: input.messageType,
          subject: input.subject,
          message: input.message,
        });
        
        // Create notification for admin users
        const admins = await db.getAdminUsers();
        for (const admin of admins) {
          await db.createNotification({
            userId: admin.id,
            type: "system",
            title: "New Contact Message",
            message: `New message from ${ctx.user.name || ctx.user.email}: ${input.subject}`,
          });
        }
        
        return { success: true, messageId };
      }),
    
    // Get user's own messages
    myMessages: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserContactMessages(ctx.user.id);
    }),
    
    // Admin: Get all messages
    allMessages: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      const messages = await db.getAllContactMessages();
      
      // Get user info for each message
      const messagesWithUser = await Promise.all(
        messages.map(async (msg) => {
          const user = await db.getUserById(msg.userId);
          return {
            ...msg,
            userName: user?.name || "Unknown",
            userEmail: user?.email || "Unknown",
          };
        })
      );
      
      return messagesWithUser;
    }),
    
    // Admin: Reply to a message
    reply: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        reply: z.string().min(1, "Reply is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        
        const message = await db.getContactMessageById(input.messageId);
        if (!message) {
          throw new Error("Message not found");
        }
        
        await db.replyToContactMessage(input.messageId, input.reply);
        
        // Notify the user about the reply
        await db.createNotification({
          userId: message.userId,
          type: "system",
          title: "Reply to Your Message",
          message: `Admin replied to your message: "${message.subject}"`,
        });
        
        return { success: true };
      }),
    
    // Admin: Update message status
    updateStatus: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        status: z.enum(["pending", "read", "replied", "closed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        
        await db.updateContactMessageStatus(input.messageId, input.status);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
