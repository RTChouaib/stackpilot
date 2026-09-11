import { getRedisClient } from "@/lib/security/rate-limit";

/**
 * Business-rule usage limits, distinct from lib/security/rate-limit.ts
 * (which defends against rapid-fire abuse/bots regardless of tier). This
 * module answers "is this generation allowed under the free/paid quota,"
 * not "is this request suspiciously fast."
 *
 * Three counters, all in Upstash Redis (no Postgres round trip on the hot
 * path):
 *  - `quota:free:device:{deviceId}:{date}` — free-tier count, resets daily.
 *  - `quota:credits:{deviceId}` — paid credit balance, does NOT reset daily;
 *    consumed only after the free quota is exhausted, persists until used.
 *  - `quota:free:ip:{ip}:{date}` — a generous per-IP ceiling as a backstop
 *    against the free cookie-based quota being defeated by clearing
 *    cookies/incognito. Deliberately loose (shared offices/NAT), not a
 *    precise per-person limit — see lib/quota/device-id.ts for the
 *    cookie-vs-IP tradeoff this is patching over.
 */

export const FREE_GENERATIONS_PER_DAY = 2;
export const CREDITS_PER_PURCHASE = 5;
export const CREDIT_PACK_PRICE_USD = 10;
const IP_DAILY_CEILING = 20; // generous — this is an abuse backstop, not the product's actual limit

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

export interface QuotaStatus {
  freeRemaining: number;
  paidCredits: number;
  totalRemaining: number;
}

export async function getQuotaStatus(deviceId: string): Promise<QuotaStatus> {
  const redis = getRedisClient();
  const [usedToday, credits] = await Promise.all([
    redis.get<number>(`quota:free:device:${deviceId}:${todayUtc()}`),
    redis.get<number>(`quota:credits:${deviceId}`),
  ]);
  const freeRemaining = Math.max(0, FREE_GENERATIONS_PER_DAY - (usedToday ?? 0));
  const paidCredits = Math.max(0, credits ?? 0);
  return { freeRemaining, paidCredits, totalRemaining: freeRemaining + paidCredits };
}

export type ConsumeResult =
  | { allowed: true; source: "free" | "paid"; status: QuotaStatus }
  | { allowed: false; reason: "daily_limit_reached" | "ip_ceiling_reached"; status: QuotaStatus };

/**
 * Atomically checks and consumes one generation, preferring the free daily
 * quota before touching paid credits. Not a single Lua transaction — two
 * sequential INCRs — so under true concurrent double-submission from the
 * same device there's a narrow window to consume one extra unit. Given the
 * cost of a single `generateObject` call and that this is a soft
 * cost-control measure (not a security boundary), that's an accepted
 * tradeoff rather than a bug; revisit with a Redis Lua script if it ever
 * matters in practice.
 */
export async function checkAndConsume(deviceId: string, ip: string): Promise<ConsumeResult> {
  const redis = getRedisClient();
  const date = todayUtc();
  const ttl = secondsUntilUtcMidnight();

  // IP backstop first — cheap to check, and blocking here avoids writing to
  // the per-device counters at all for an already-over-ceiling IP.
  const ipKey = `quota:free:ip:${ip}:${date}`;
  const ipCountBefore = (await redis.get<number>(ipKey)) ?? 0;
  if (ipCountBefore >= IP_DAILY_CEILING) {
    const status = await getQuotaStatus(deviceId);
    return { allowed: false, reason: "ip_ceiling_reached", status };
  }

  const status = await getQuotaStatus(deviceId);

  if (status.freeRemaining > 0) {
    const deviceKey = `quota:free:device:${deviceId}:${date}`;
    const newCount = await redis.incr(deviceKey);
    if (newCount === 1) await redis.expire(deviceKey, ttl);
    await bumpIpCounter(redis, ipKey, ttl);
    return {
      allowed: true,
      source: "free",
      status: { ...status, freeRemaining: status.freeRemaining - 1, totalRemaining: status.totalRemaining - 1 },
    };
  }

  if (status.paidCredits > 0) {
    const creditsKey = `quota:credits:${deviceId}`;
    await redis.decr(creditsKey);
    await bumpIpCounter(redis, ipKey, ttl);
    return {
      allowed: true,
      source: "paid",
      status: { ...status, paidCredits: status.paidCredits - 1, totalRemaining: status.totalRemaining - 1 },
    };
  }

  return { allowed: false, reason: "daily_limit_reached", status };
}

async function bumpIpCounter(redis: ReturnType<typeof getRedisClient>, ipKey: string, ttl: number): Promise<void> {
  const newIpCount = await redis.incr(ipKey);
  if (newIpCount === 1) await redis.expire(ipKey, ttl);
}

/**
 * Grants a purchased credit pack. Called only from the Stripe webhook
 * handler after a verified `checkout.session.completed` event — never from
 * a client-reachable route, since this directly adds spendable quota.
 */
export async function grantCredits(deviceId: string, amount: number): Promise<void> {
  const redis = getRedisClient();
  await redis.incrby(`quota:credits:${deviceId}`, amount);
}
