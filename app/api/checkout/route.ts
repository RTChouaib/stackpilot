import { NextResponse, type NextRequest } from "next/server";
import { getStripeClient } from "@/lib/payments/stripe";
import { getOrCreateDeviceId } from "@/lib/quota/device-id";
import { CREDITS_PER_PURCHASE, CREDIT_PACK_PRICE_USD } from "@/lib/quota";
import { assertTrustedOrigin } from "@/lib/security/origin-check";
import { getLeadSubmissionRateLimiter, getClientIp, checkRateLimit } from "@/lib/security/rate-limit";

/**
 * Creates a Stripe Checkout Session for the $10 / 5-extra-generations pack.
 * The device cookie (set the first time the wizard was ever used — see
 * lib/quota/device-id.ts) is embedded in the session's metadata, so the
 * webhook knows whose quota to credit once payment completes. No account or
 * login is required to buy credits, matching how the free quota itself
 * works.
 */
export async function POST(request: NextRequest) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit(getLeadSubmissionRateLimiter(), `checkout:${ip}`);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment and try again." }, { status: 429 });
  }

  const { id: deviceId } = await getOrCreateDeviceId();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://stackpilot.app";

  if (!process.env.STRIPE_SECRET_KEY) {
    // The wizard hides the "buy more" button when /api/quota reports
    // paymentsEnabled: false, so reaching here means either a stale page
    // (opened before Stripe was configured/unconfigured) or a direct API
    // call — either way, a clean error beats an unhandled exception.
    return NextResponse.json(
      { error: "Purchasing extra generations isn't available yet. Please try again later." },
      { status: 503 }
    );
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: CREDIT_PACK_PRICE_USD * 100,
          product_data: {
            name: `${CREDITS_PER_PURCHASE} additional StackPilot blueprint generations`,
            description: "Use anytime — these don't expire and stack with your daily free generations.",
          },
        },
        quantity: 1,
      },
    ],
    metadata: { deviceId, creditsGranted: String(CREDITS_PER_PURCHASE) },
    success_url: `${appUrl}/wizard?purchase=success`,
    cancel_url: `${appUrl}/wizard?purchase=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
