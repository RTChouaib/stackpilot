import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Lazily constructs the Redis client on first use rather than at module
 * import time. This means:
 *  - Importing this module (e.g. transitively, via a page that doesn't
 *    actually rate-limit anything) never throws just because Upstash isn't
 *    configured yet.
 *  - The FIRST actual rate-limit check, if Upstash is misconfigured, throws
 *    one clear error naming exactly which env vars are missing — instead of
 *    the previous behavior, where `process.env.X!` silently produced a
 *    client pointed at `undefined`, which then failed with an opaque
 *    network/auth error deep inside the Upstash SDK.
 */
let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const missing = [
    !url && "UPSTASH_REDIS_REST_URL",
    !token && "UPSTASH_REDIS_REST_TOKEN",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Rate limiting is not configured: missing ${missing.join(", ")}. ` +
        `Set both in .env.local (see .env.example), or provision a free Upstash Redis database at https://upstash.com.`
    );
  }

  redisClient = new Redis({ url: url!, token: token! });
  return redisClient;
}

let aiLimiterInstance: Ratelimit | null = null;
let leadLimiterInstance: Ratelimit | null = null;

/**
 * Blueprint generation is the expensive path (one `generateObject` call per
 * request), so it gets the tightest limit: 3 requests per hour per IP.
 */
export function getAiGenerationRateLimiter(): Ratelimit {
  if (!aiLimiterInstance) {
    aiLimiterInstance = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(3, "1 h"),
      analytics: true,
      prefix: "ratelimit:ai-generation",
    });
  }
  return aiLimiterInstance;
}

/**
 * Lead forms (MVP quote, builder match, newsletter, admin login) are cheap
 * to process but are the most attractive target for spam/scraping bots, so
 * they get a shorter, higher-frequency window: 5 submissions per 10 minutes
 * per IP.
 */
export function getLeadSubmissionRateLimiter(): Ratelimit {
  if (!leadLimiterInstance) {
    leadLimiterInstance = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      analytics: true,
      prefix: "ratelimit:lead-submission",
    });
  }
  return leadLimiterInstance;
}

/**
 * Resolves the caller's IP from standard proxy headers. Vercel populates
 * `x-forwarded-for`; fall back to a constant so local dev doesn't throw.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Checks a rate limit and NEVER throws — if Redis/Upstash is unreachable or
 * misconfigured, this fails open (returns success: true) rather than taking
 * down every rate-limited route because an infra dependency hiccuped. The
 * error is still logged so it's visible in observability tooling.
 *
 * Failing open is a deliberate availability-over-strictness tradeoff for a
 * lead-gen product: a rate limiter outage should never mean founders can't
 * generate blueprints. If your abuse profile is different, change the
 * catch block to fail closed instead.
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("[checkRateLimit] Rate limiter unavailable, failing open:", error);
    return { success: true, limit: 0, remaining: 0, reset: Date.now() };
  }
}
