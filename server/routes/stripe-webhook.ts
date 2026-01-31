import express from "express";
import Stripe from "stripe";
import { updateUserCreditsBalance } from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const router = express.Router();

router.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("[Webhook] No signature found");
      return res.status(400).send("No signature");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error(`[Webhook] Signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({
        verified: true,
      });
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          
          const userId = parseInt(session.metadata?.userId || "0");
          const credits = parseInt(session.metadata?.credits || "0");
          
          if (!userId || !credits) {
            console.error("[Webhook] Missing userId or credits in metadata");
            break;
          }

          // Add credits to user account
          await updateUserCreditsBalance(
            userId,
            credits,
            "purchase",
            `Purchased ${credits} credits via Stripe`,
            {
              stripePaymentIntentId: session.payment_intent,
              stripeSessionId: session.id,
            }
          );

          console.log(`[Webhook] Added ${credits} credits to user ${userId}`);
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.error(`[Webhook] Payment failed: ${paymentIntent.id}`);
          break;
        }

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error(`[Webhook] Error processing event: ${error.message}`);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

export default router;
