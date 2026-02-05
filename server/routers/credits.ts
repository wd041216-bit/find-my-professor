import { router, protectedProcedure } from "../_core/trpc";
import { checkAndResetCredits } from "../services/credits";
import * as db from "../db";

export const creditsRouter = router({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const balance = await checkAndResetCredits(ctx.user.id);
    const userCredits = await db.getUserCredits(ctx.user.id);
    return {
      balance,
      lastReset: userCredits?.lastResetDate || new Date().toISOString().split('T')[0],
    };
  }),
});
