import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

// neon-http driver is used because it works in both the Node runtime and the
// Edge runtime (needed for middleware and edge-deployed route handlers).
// Swap for `drizzle-orm/postgres-js` + the `postgres` package if you're on
// Supabase and prefer a persistent connection pool instead of Neon's HTTP driver.
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
