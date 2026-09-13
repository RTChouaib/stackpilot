import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

// Supabase's pooler runs PgBouncer in transaction mode, which doesn't
// support prepared statements — prepare: false is required, not optional.
const client = postgres(process.env.DATABASE_URL, { prepare: false });

export function isDatabaseConnectionError(error: unknown): boolean {
  const candidates: string[] = [];
  if (error && typeof error === "object") {
    const maybeError = error as { code?: string; message?: string; cause?: unknown };
    if (maybeError.code) candidates.push(String(maybeError.code));
    if (maybeError.message) candidates.push(maybeError.message);
    if (maybeError.cause && typeof maybeError.cause === "object") {
      const cause = maybeError.cause as { code?: string; message?: string };
      if (cause.code) candidates.push(String(cause.code));
      if (cause.message) candidates.push(cause.message);
    }
  }

  const combined = candidates.join(" ").toLowerCase();
  return [
    "enotfound",
    "econnrefused",
    "econnreset",
    "etimedout",
    "eai_again",
    "ehostunreach",
    "ecancelled",
    "econnaborted",
    "epipe",
  ].some((code) => combined.includes(code)) || /getaddrinfo|could not connect|connection.*refused|timed out|database.*unavailable|failed to connect/i.test(combined);
}

export const db = drizzle(client, { schema });
