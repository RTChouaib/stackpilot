import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/payments/stripe";
import { grantCredits } from "@/lib/quota";
import { getRedisClient } from "@/lib/security/rate-limit";
import { db } from "@/lib/db";
import { creditPurchases } from "@/lib/db/schema";

export const runtime = "nodejs"; // needs the raw request body for signature verification

/**
 * Stripe webhook: the ONLY place credits are ever granted. Never trust a
 * client-side "payment succeeded" callback for this — Checkout's
 * success_url redirect is purely a UX nicety and is trivially spoofable
 * (anyone can navigate to /wizard?purchase=success without paying). This
 * route verifies Stripe's signature on the raw body before touching
 * anything, which is what actually proves the event came from Stripe.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Idempotency: Stripe can and does redeliver the same event (retries,
  // duplicate delivery). Record processed event IDs in Redis with a TTL
  // comfortably longer than Stripe's retry window, and bail out on a
  // repeat before granting credits a second time.
  const redis = getRedisClient();
  const dedupeKey = `stripe:event:${event.id}`;
  const firstSeen = await redis.set(dedupeKey, "1", { nx: true, ex: 60 * 60 * 24 * 7 });
  if (firstSeen === null) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const deviceId = session.metadata?.deviceId;
    const creditsGranted = Number(session.metadata?.creditsGranted ?? 0);

    if (!deviceId || !creditsGranted) {
      console.error("[stripe webhook] checkout.session.completed missing deviceId/creditsGranted metadata", session.id);
      return NextResponse.json({ error: "Missing metadata." }, { status: 400 });
    }

    await grantCredits(deviceId, creditsGranted);

    // Durable audit trail — Redis holds the live spendable balance, this
    // table is the permanent record for accounting/support/refund lookups.
    try {
      await db.insert(creditPurchases).values({
        deviceId,
        stripeSessionId: session.id,
        amountUsdCents: session.amount_total ?? 0,
        creditsGranted,
        customerEmail: session.customer_details?.email ?? null,
      });
    } catch (error) {
      // Credits are already granted at this point (Redis, above) — a DB
      // write failure here shouldn't un-grant them. Log for reconciliation
      // rather than failing the webhook (a failed webhook makes Stripe
      // retry, which would hit the dedupe check and skip granting again
      // anyway, silently dropping the audit row for good).
      console.error("[stripe webhook] Failed to record credit purchase audit row:", error);
    }
  }

  return NextResponse.json({ ok: true });
}
