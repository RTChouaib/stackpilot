import { randomBytes } from "crypto";

/**
 * Generates an unguessable 128-bit (16 byte / 32 hex char) share token.
 * This — not the blueprint's UUID primary key — is what appears in public
 * URLs, so blueprint links can't be enumerated by walking sequential or
 * predictable IDs.
 */
export function generateShareToken(): string {
  return randomBytes(16).toString("hex");
}
