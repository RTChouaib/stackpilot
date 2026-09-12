import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { assertTrustedOrigin } from "./origin-check";

const APP_URL = "https://stackpilot.app";

function makeRequest(method: string, headers: Record<string, string> = {}) {
  return new NextRequest(`${APP_URL}/api/leads`, { method, headers });
}

describe("assertTrustedOrigin", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    // The check is a no-op outside production (see the module's own
    // comment on why) — force production for these tests so we're actually
    // exercising the check, not the dev bypass.
    (process.env as Record<string, string>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = APP_URL;
  });

  afterEach(() => {
    (process.env as Record<string, string>).NODE_ENV = originalEnv ?? "test";
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("allows GET/HEAD requests regardless of origin", () => {
    const req = makeRequest("GET", { origin: "https://evil.example" });
    expect(assertTrustedOrigin(req).ok).toBe(true);
  });

  it("allows a POST with a matching Origin header", () => {
    const req = makeRequest("POST", { origin: APP_URL });
    expect(assertTrustedOrigin(req).ok).toBe(true);
  });

  it("rejects a POST with a mismatched Origin header", () => {
    const req = makeRequest("POST", { origin: "https://evil.example" });
    expect(assertTrustedOrigin(req).ok).toBe(false);
  });

  it("allows a POST from the current app origin even when NEXT_PUBLIC_APP_URL is different", () => {
    const req = new NextRequest("https://app.example.com/api/leads", {
      method: "POST",
      headers: { origin: "https://app.example.com" },
    });
    expect(assertTrustedOrigin(req).ok).toBe(true);
  });

  it("rejects a POST with no Origin or Referer header", () => {
    const req = makeRequest("POST");
    expect(assertTrustedOrigin(req).ok).toBe(false);
  });

  it("falls back to Referer when Origin is absent", () => {
    const req = makeRequest("POST", { referer: `${APP_URL}/wizard` });
    expect(assertTrustedOrigin(req).ok).toBe(true);
  });

  it("rejects a malformed Origin header rather than throwing", () => {
    const req = makeRequest("POST", { origin: "not a url" });
    expect(() => assertTrustedOrigin(req)).not.toThrow();
    expect(assertTrustedOrigin(req).ok).toBe(false);
  });
});
