// Run with: npm run db:seed -- you@example.com "a-strong-password"
// Creates (or updates the password for) an admin user. Safe to re-run.
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
import { hashPassword } from "../auth/password";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npm run db:seed -- you@example.com "a-strong-password"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    await db.update(users).set({ passwordHash, role: "admin" }).where(eq(users.id, existing.id));
    console.log(`Updated password for existing admin ${email}.`);
  } else {
    await db.insert(users).values({ email, role: "admin", passwordHash });
    console.log(`Created admin user ${email}.`);
  }
  console.log("Log in at /admin/login with this email and password.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
