import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/quota/device-id";
import { getQuotaStatus, FREE_GENERATIONS_PER_DAY, CREDITS_PER_PURCHASE, CREDIT_PACK_PRICE_USD } from "@/lib/quota";

export const dynamic = "force-dynamic"; // per-device, must never be cached/prerendered

/**
 * Public read-only quota check so the wizard can show "1 free generation
 * left today" before the user has even finished the questionnaire, rather
 * than only discovering the limit on final submit. Also sets the device
 * cookie on first visit if it doesn't exist yet (same helper the
 * generation route uses), so the count is consistent from the very first
 * page load.
 */
export async function GET() {
  const { id: deviceId } = await getOrCreateDeviceId();
  const status = await getQuotaStatus(deviceId);
  return NextResponse.json({
    ...status,
    freeGenerationsPerDay: FREE_GENERATIONS_PER_DAY,
    creditsPerPurchase: CREDITS_PER_PURCHASE,
    creditPackPriceUsd: CREDIT_PACK_PRICE_USD,
    // Lets the wizard hide the "buy more" button entirely rather than
    // showing it and having it fail when clicked — this app runs fine with
    // Stripe unconfigured (the free daily quota still works), it just can't
    // sell top-ups until STRIPE_SECRET_KEY is set.
    paymentsEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
  });
}
