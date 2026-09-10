import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("produces a hash that verifies correctly against the original password", async () => {
    const hash = await hashPassword("a-strong-password-123");
    expect(await verifyPassword("a-strong-password-123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("a-strong-password-123");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const hashA = await hashPassword("same-password");
    const hashB = await hashPassword("same-password");
    expect(hashA).not.toBe(hashB);
  });

  it("never stores the plaintext password inside the hash", async () => {
    const hash = await hashPassword("super-secret-value");
    expect(hash).not.toContain("super-secret-value");
  });
});
