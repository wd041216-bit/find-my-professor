import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";

export const feedbackRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        rating: z.number().int().min(1).max(5),
        message: z.string().min(1).max(2000),
        userEmail: z.string().email().optional(),
        page: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const stars = "⭐".repeat(input.rating);
      const userInfo = ctx.user
        ? `Logged-in user: ${ctx.user.name ?? "unknown"} (${ctx.user.email ?? "no email"})`
        : input.userEmail
        ? `Guest user email: ${input.userEmail}`
        : "Guest user (anonymous)";

      const title = `[ProfMatch Feedback] ${stars} ${input.rating}/5 stars`;
      const content = [
        `Rating: ${input.rating}/5 ${stars}`,
        `From: ${userInfo}`,
        input.page ? `Page: ${input.page}` : null,
        ``,
        `Message:`,
        input.message,
        ``,
        `Submitted at: ${new Date().toISOString()}`,
      ]
        .filter((line) => line !== null)
        .join("\n");

      const delivered = await notifyOwner({ title, content });
      return { success: delivered };
    }),
});
