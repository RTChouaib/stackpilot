import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Lazily constructed, same pattern as lib/security/rate-limit.ts's Redis
 * client — importing this module never throws just because Stripe isn't
 * configured yet; only the first actual checkout/webhook call does, with a
 * clear message naming the missing var.
 */
export function getStripeClient(): Stripe {
  if (client) return client;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Payments are not configured: missing STRIPE_SECRET_KEY. Set it in .env.local (see .env.example)."
    );
  }
  client = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
  return client;
}
