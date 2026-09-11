import { describe, it, expect, vi, beforeEach } from "vitest";

// lib/quota/index.ts reaches into Upstash Redis via getRedisClient(), which
// throws if UPSTASH_* env vars aren't set. Rather than requiring live Redis
// for this suite, mock the client with an in-memory Map that implements
// just the handful of commands quota logic actually uses (get/incr/decr/
// incrby/expire) — enough to verify the *ordering and math*, which is where
// a quota system actually goes wrong (off-by-ones, wrong consumption order,
// day-boundary edge cases), without testing Upstash's own correctness.
const store = new Map<string, number>();

vi.mock("@/lib/security/rate-limit", () => ({
  getRedisClient: () => ({
    get: async (key: string) => store.get(key) ?? null,
    incr: async (key: string) => {
      const next = (store.get(key) ?? 0) + 1;
      store.set(key, next);
      return next;
    },
    decr: async (key: string) => {
      const next = (store.get(key) ?? 0) - 1;
      store.set(key, next);
      return next;
    },
    incrby: async (key: string, amount: number) => {
      const next = (store.get(key) ?? 0) + amount;
      store.set(key, next);
      return next;
    },
    expire: async () => 1,
  }),
}));

const { checkAndConsume, getQuotaStatus, grantCredits, FREE_GENERATIONS_PER_DAY } = await import("./index");

describe("quota", () => {
  beforeEach(() => {
    store.clear();
  });

  it("allows generations up to the free daily limit", async () => {
    const deviceId = "device-a";
    for (let i = 0; i < FREE_GENERATIONS_PER_DAY; i++) {
      const result = await checkAndConsume(deviceId, "1.1.1.1");
      expect(result.allowed).toBe(true);
      if (result.allowed) expect(result.source).toBe("free");
    }
  });

  it("denies once the free daily limit is exhausted with no paid credits", async () => {
    const deviceId = "device-b";
    for (let i = 0; i < FREE_GENERATIONS_PER_DAY; i++) {
      await checkAndConsume(deviceId, "2.2.2.2");
    }
    const result = await checkAndConsume(deviceId, "2.2.2.2");
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe("daily_limit_reached");
  });

  it("falls through to paid credits once the free quota is exhausted", async () => {
    const deviceId = "device-c";
    await grantCredits(deviceId, 5);
    for (let i = 0; i < FREE_GENERATIONS_PER_DAY; i++) {
      await checkAndConsume(deviceId, "3.3.3.3");
    }
    const result = await checkAndConsume(deviceId, "3.3.3.3");
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.source).toBe("paid");
  });

  it("consumes free quota before touching paid credits, never the reverse", async () => {
    const deviceId = "device-d";
    await grantCredits(deviceId, 5);
    const first = await checkAndConsume(deviceId, "4.4.4.4");
    expect(first.allowed).toBe(true);
    if (first.allowed) expect(first.source).toBe("free");
    const status = await getQuotaStatus(deviceId);
    expect(status.paidCredits).toBe(5); // untouched — free was consumed first
  });

  it("keeps quota isolated per device", async () => {
    await checkAndConsume("device-e1", "5.5.5.5");
    await checkAndConsume("device-e1", "5.5.5.5");
    const otherDeviceStatus = await getQuotaStatus("device-e2");
    expect(otherDeviceStatus.freeRemaining).toBe(FREE_GENERATIONS_PER_DAY);
  });

  it("grantCredits adds to an existing balance rather than overwriting it", async () => {
    const deviceId = "device-f";
    await grantCredits(deviceId, 5);
    await grantCredits(deviceId, 5);
    const status = await getQuotaStatus(deviceId);
    expect(status.paidCredits).toBe(10);
  });
});
