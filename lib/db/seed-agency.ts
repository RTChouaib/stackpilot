// Run with:
//   npm run db:seed-agency -- "acme-agency" "Acme Agency" you@acme.com "a-strong-password"
// Creates an agency + its first partner_agency login. Safe to re-run: updates
// the agency's contact email and the user's password if they already exist.
import { eq } from "drizzle-orm";
import { db } from "./index";
import { agencies, users } from "./schema";
import { hashPassword } from "../auth/password";

async function main() {
  const [slug, name, email, password] = process.argv.slice(2);
  if (!slug || !name || !email || !password) {
    console.error(
      'Usage: npm run db:seed-agency -- "acme-agency" "Acme Agency" you@acme.com "a-strong-password"'
    );
    process.exit(1);
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error("Slug must be lowercase letters, numbers, and hyphens only (it appears in the URL).");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const [existingAgency] = await db.select().from(agencies).where(eq(agencies.slug, slug)).limit(1);
  const agency = existingAgency
    ? (await db.update(agencies).set({ name, contactEmail: email }).where(eq(agencies.id, existingAgency.id)).returning())[0]!
    : (await db.insert(agencies).values({ slug, name, contactEmail: email }).returning())[0]!;

  const passwordHash = await hashPassword(password);
  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser) {
    await db.update(users).set({ passwordHash, role: "partner_agency", agencyId: agency.id }).where(eq(users.id, existingUser.id));
  } else {
    await db.insert(users).values({ email, role: "partner_agency", agencyId: agency.id, passwordHash });
  }

  console.log(`Agency "${name}" ready at /w/${slug} (branded wizard) and /agency/${slug} (dashboard).`);
  console.log(`Log in at /admin/login with ${email}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
