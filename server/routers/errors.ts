import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const errorsRouter = router({
  /**
   * Log a frontend error (public endpoint - works for unauthenticated users)
   */
  logError: publicProcedure
    .input(z.object({
      message: z.string(),
      stack: z.string().optional(),
      errorType: z.string().optional(),
      url: z.string(),
      userAgent: z.string().optional(),
      browserInfo: z.string().optional(),
      componentStack: z.string().optional(),
      additionalInfo: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const errorLog = await db.createErrorLog({
          userId: ctx.user?.id || null,
          message: input.message,
          stack: input.stack || null,
          errorType: input.errorType || null,
          url: input.url,
          userAgent: input.userAgent || null,
          browserInfo: input.browserInfo || null,
          componentStack: input.componentStack || null,
          additionalInfo: input.additionalInfo || null,
        });

        console.log(`[Error Log] Logged error #${errorLog.id}: ${input.message}`);
        
        return { success: true, errorId: errorLog.id };
      } catch (error) {
        console.error('[Error Log] Failed to log error:', error);
        // Don't throw error to avoid infinite loop
        return { success: false };
      }
    }),

  /**
   * Get all error logs (admin only)
   */
  getAll: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      resolved: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      return db.getErrorLogs(input.limit, input.offset, input.resolved);
    }),

  /**
   * Get error log statistics (admin only)
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
    }

    return db.getErrorLogStats();
  }),

  /**
   * Mark error as resolved (admin only)
   */
  markResolved: protectedProcedure
    .input(z.object({
      errorId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      return db.markErrorResolved(input.errorId, ctx.user.id, input.notes);
    }),

  /**
   * Delete error log (admin only)
   */
  delete: protectedProcedure
    .input(z.object({
      errorId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      return db.deleteErrorLog(input.errorId);
    }),
});
