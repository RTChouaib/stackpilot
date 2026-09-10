import { describe, it, expect } from "vitest";
import { generateShareToken } from "./token";

describe("generateShareToken", () => {
  it("produces a 32-character hex string (128 bits)", () => {
    const token = generateShareToken();
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it("produces distinct tokens across calls", () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => generateShareToken()));
    expect(tokens.size).toBe(1000);
  });
});
