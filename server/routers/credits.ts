import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import Stripe from "stripe";
import { getUserCredits, createUserCredits, getCreditTransactions, updateStripeCustomerId } from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export const creditsRouter = router({
  // Get user's credit balance
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    let credits = await getUserCredits(ctx.user.id);
    if (!credits) {
      credits = await createUserCredits(ctx.user.id);
    }
    return credits;
  }),

  // Get credit transaction history
  getTransactions: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ ctx, input }) => {
      return getCreditTransactions(ctx.user.id, input.limit);
    }),

  // Create Stripe checkout session for credit purchase
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        credits: z.number().min(100).max(100000), // Min 100 credits, max 100000 credits
        currency: z.enum(["usd", "cny"]).default("usd"), // Support USD and CNY only
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { credits, currency } = input;
      
      // Calculate amount based on currency
      // USD: $1 = 100 credits
      // CNY: ¥7 = 100 credits (approximately $1 USD = ¥7 CNY)
      let amountInCents: number;
      if (currency === "cny") {
        amountInCents = Math.round((credits / 100) * 700); // ¥7 = 100 credits
      } else {
        amountInCents = Math.round((credits / 100) * 100); // $1 = 100 credits
      }

      // Get or create Stripe customer
      let stripeCustomerId: string | undefined;
      const userCreditsRecord = await getUserCredits(ctx.user.id);
      
      if (userCreditsRecord?.stripeCustomerId) {
        stripeCustomerId = userCreditsRecord.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: ctx.user.email || undefined,
          name: ctx.user.name || undefined,
          metadata: {
            userId: ctx.user.id.toString(),
          },
        });
        stripeCustomerId = customer.id;
        if (stripeCustomerId) {
          await updateStripeCustomerId(ctx.user.id, stripeCustomerId);
        }
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card", "alipay", "wechat_pay"],
        payment_method_options: {
          wechat_pay: {
            client: "web",
          },
        },
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: `${credits} Credits`,
                description: `Purchase ${credits} credits for Find My Professor`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${ctx.req.headers.origin}/dashboard?payment=success`,
        cancel_url: `${ctx.req.headers.origin}/dashboard?payment=cancelled`,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          userId: ctx.user.id.toString(),
          credits: credits.toString(),
          currency: currency,
          customerEmail: ctx.user.email || "",
          customerName: ctx.user.name || "",
        },
        allow_promotion_codes: true,
      });

      return { url: session.url };
    }),
});
