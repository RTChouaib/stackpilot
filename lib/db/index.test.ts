import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.DATABASE_URL = "postgresql://localhost:5432/test";
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("isDatabaseConnectionError", () => {
  it("flags DNS and connection failures from postgres", async () => {
    const mod = await import("./index");

    expect(
      mod.isDatabaseConnectionError(
        Object.assign(new Error("getaddrinfo ENOTFOUND db.example.supabase.co"), {
          code: "ENOTFOUND",
        })
      )
    ).toBe(true);

    expect(mod.isDatabaseConnectionError({ code: "ECONNREFUSED" })).toBe(true);
  });

  it("ignores ordinary request validation errors", async () => {
    const mod = await import("./index");

    expect(mod.isDatabaseConnectionError(new Error("Invalid questionnaire payload."))).toBe(false);
  });
});
