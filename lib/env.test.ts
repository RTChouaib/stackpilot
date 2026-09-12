import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getEnv } from "./env";

describe("getEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("requires DEEPSEEK_API_KEY and rejects OPENAI-only setups", () => {
    delete process.env.DEEPSEEK_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test-openai";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    process.env.RESEND_API_KEY = "resend-key";
    process.env.ADMIN_ALERT_EMAIL = "admin@example.com";
    process.env.JWT_SECRET = "12345678901234567890123456789012";

    expect(() => getEnv()).toThrow(/DEEPSEEK_API_KEY/i);
  });

  it("accepts a DEEPSEEK config without requiring OPENAI", () => {
    process.env.DEEPSEEK_API_KEY = "sk-test-deepseek";
    delete process.env.OPENAI_API_KEY;
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    process.env.RESEND_API_KEY = "resend-key";
    process.env.ADMIN_ALERT_EMAIL = "admin@example.com";
    process.env.JWT_SECRET = "12345678901234567890123456789012";

    expect(() => getEnv()).not.toThrow();
  });
});
