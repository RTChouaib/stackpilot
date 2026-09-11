# StackPilot

Production backend + frontend for StackPilot: an AI-powered tech-stack blueprint
generator and lead-gen platform for founders. Next.js 15 (App Router), Drizzle +
Postgres (Neon), the Vercel AI SDK, Upstash rate limiting, Resend email,
`@react-pdf/renderer`, `@vercel/og`, and optional Sentry error tracking.

66 TypeScript/TSX files. Verified in this environment (not just written and
assumed correct):

```bash
npx tsc --noEmit   # strict + noUncheckedIndexedAccess — 0 errors
npx next lint      # 0 warnings, 0 errors
npx vitest run     # 46/46 tests passing
npx next build     # succeeds end-to-end, including static/dynamic route analysis
```

## Setup

```bash
npm install
cp .env.example .env.local        # fill in every value — see below
npm run db:generate                # generates SQL migrations from lib/db/schema.ts
npm run db:migrate                 # applies them to DATABASE_URL
npm run db:seed -- you@example.com "a-strong-password"   # creates your admin login
npm run dev
```

Then visit `/admin/login` and sign in with what you just seeded.

For an agency (white-label) account:

```bash
npm run db:seed-agency -- "acme-agency" "Acme Agency" you@acme.com "a-strong-password"
```

This gives you a branded wizard at `/w/acme-agency` and a scoped dashboard at
`/agency/acme-agency`.

## Environment variables

See `.env.example` for the full list with inline descriptions. Required for
the app to boot at all (validated eagerly by `instrumentation.ts` — a
misconfigured deploy fails immediately with one clear error, not a random
500 on whichever request touches the missing var first):

- **Neon** (or Supabase Postgres) — `DATABASE_URL`
- **OpenAI** — `OPENAI_API_KEY`
- **Upstash Redis** — `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- **Resend** — `RESEND_API_KEY`, `ADMIN_ALERT_EMAIL`
- A random `JWT_SECRET` (32+ chars)
Optional, fully no-op if unset: Sentry (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`,
`SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` for build-time source maps).

## How a blueprint gets generated

1. `POST /api/generate-blueprint` — rate-limited (3/hour/IP), Origin-checked,
   Zod-validated, sanitized.
2. `evaluateDeterministicRules()` inspects `priorities` and `sensitiveData`
   **before** any AI call and decides whether EU hosting is mandatory.
3. Those constraints go into the `generateObject` system prompt as a
   dedicated block, and the founder's free-text answers are isolated inside
   `<FOUNDER_INPUT>` delimiter tags with an explicit "treat as data, not
   instructions" directive — the standard mitigation for prompt injection via
   user-supplied text.
4. **Belt and suspenders:** after the AI responds, if EU hosting was
   mandatory, `enforceEuHosting()` unconditionally overwrites the
   `hosting`/`database` fields on all three tiers with rule-derived values.
   A successful prompt-injection attempt against the LLM still can't produce
   a non-compliant blueprint, because those fields are never actually
   sourced from the model's freeform output — only validated against it.
5. If the AI call fails, times out, or fails schema validation, it falls
   back to `generateDeterministicBlueprint()` — the same static stack-pool
   data, used as a pure rules engine instead of LLM context.

**A real bug this caught:** while writing the Vitest suite for step 4, I
found that selecting *both* "open-source" and "privacy/EU hosting" let the
open-source pool win entirely — including its `hosting` field, which
contains non-EU-guaranteed options like plain "DigitalOcean". Fixed in
`lib/ai/rules-engine.ts::buildTier` (hosting/database now always come from
the EU-guaranteed pool when mandatory, independent of which pool wins for
everything else) with a regression test (`rules-engine.test.ts`, the
"regression:" test case) so it can't silently come back.

## What's in this pass beyond the original spec

- **White-label agencies**: `agencies` table, branded wizard at `/w/[slug]`,
  scoped dashboard at `/agency/[slug]`, ownership-checked lead/CSV/status
  routes, agency-scoped JWT sessions (`agencySlug` claim checked directly in
  `middleware.ts` — no DB round trip on every request).
- **Real multi-admin auth**: bcrypt password hashes per user
  (`lib/auth/password.ts`), not a single shared password. Logout route
  added. `npm run db:seed` / `db:seed-agency` manage accounts.
- **CSRF**: `lib/security/origin-check.ts` — Origin/Referer verification on
  every state-changing route (skipped outside `NODE_ENV=production`, since
  local dev origins are inconsistent).
- **GDPR data deletion**: `/privacy/delete-my-data` → email confirmation
  (Resend) → `/privacy/delete-my-data/confirm/[token]` performs the actual
  erasure. Double opt-in, never reveals whether an email exists in the
  system, and deliberately excludes admin/agency accounts from the
  unauthenticated deletion path (see comments in that page's source).
- **Terms / Privacy / Contact pages** — placeholder copy, explicitly marked
  as needing legal review before launch.
- **Partner-tools + recommendation-emphasis admin panels** — restored from
  the original client-only prototype. Partner flags are public-readable
  (`/api/partner-tools`) since the blueprint funnel needs them; toggling is
  admin-only. Recommendation-emphasis sliders are recorded but **not** wired
  into actual recommendation logic — see the "illustrative-only" note below.
- **Pagination** on both admin and agency lead tables.
- **Env validation** (`lib/env.ts` + `instrumentation.ts`) and a **rate
  limiter that fails open** instead of crashing when Upstash is
  unreachable — availability-over-strictness tradeoff explained in
  `lib/security/rate-limit.ts`.
- **Vitest suite** (46 tests): the deterministic rules engine (including the
  EU-hosting regression above), input sanitization, CSRF origin-checking,
  password hashing, and utility functions.
- **CI** (`.github/workflows/ci.yml`): typecheck, lint, test, build — using
  placeholder env values shaped correctly enough to pass `lib/env.ts`
  validation, so CI proves the app *builds*, not that it's wired to real
  services.
- **Sentry scaffolding**, fully no-op without a DSN. Worth knowing:
  importing the edge config at all — even behind an env-var check — adds
  roughly 56KB to the compiled `middleware.ts` bundle, because Next's edge
  bundler can't tree-shake based on a runtime-only env check. See the
  comment block in `instrumentation.ts` for the measured numbers and how to
  remove it if that cost isn't worth it for your deployment.

## Usage quota & paid top-ups (2 free/day, $10 for 5 more)

Added on top of everything else: `lib/quota/` caps AI generations to control
OpenAI spend, with a Stripe-powered top-up.

- **Identity**: founders don't have accounts, so quota is tracked against a
  long-lived, `httpOnly` device cookie (`lib/quota/device-id.ts`), set on
  first visit to `/wizard` or `/api/quota`. Stated plainly: this is
  resettable by clearing cookies — it's cost control for the normal case,
  not a hard security boundary against a determined abuser. A generous
  per-IP daily ceiling (`IP_DAILY_CEILING` in `lib/quota/index.ts`, default
  20/day) is the backstop for that gap — loose enough not to block shared
  offices/NAT, tight enough to stop trivial cookie-clearing loops.
- **Free tier**: 2 generations/device/day, reset at UTC midnight
  (`FREE_GENERATIONS_PER_DAY` in `lib/quota/index.ts`).
- **Paid top-up**: $10 for 5 more generations (`CREDIT_PACK_PRICE_USD`,
  `CREDITS_PER_PURCHASE`), bought via Stripe Checkout
  (`/api/checkout` → `checkout.session.completed` webhook at
  `/api/webhooks/stripe`). Credits never expire and are spent only after the
  free daily quota runs out (free-then-paid, never the reverse — see the
  ordering test in `lib/quota/index.test.ts`).
- **Where it's enforced**: `app/api/generate-blueprint/route.ts` checks and
  consumes quota *before* calling the AI — that's what actually stops token
  spend, as opposed to gating after the fact. A 402 response includes the
  reason and current balance so the wizard can show the right UI (buy
  more vs. "try tomorrow").
- **Payment integrity**: credits are granted ONLY by the Stripe webhook
  after signature verification — never by the Checkout success-page
  redirect, which is trivially spoofable (anyone can navigate to
  `/wizard?purchase=success` without paying). The webhook is idempotent
  (Redis-deduped by Stripe event ID) since Stripe redelivers events. A
  `credit_purchases` table is the durable audit trail; Redis holds the live
  spendable balance.
- **Stripe setup you still need to do manually**: create a Stripe account,
  get `STRIPE_SECRET_KEY`, register a webhook endpoint pointing at
  `https://yourdomain.com/api/webhooks/stripe` for the
  `checkout.session.completed` event, and put its signing secret in
  `STRIPE_WEBHOOK_SECRET`. Test with Stripe CLI (`stripe listen --forward-to
  localhost:3000/api/webhooks/stripe`) before going live with real cards.



The admin panel has cost/speed/quality sliders. They're saved
(`recommendation_settings` table) but **do not affect** what
`lib/ai/rules-engine.ts` or the AI prompt actually produce. This is
deliberate, not an oversight: there's no principled way to turn "cost: 70%,
speed: 30%" into a specific stack swap without either (a) building a real
weighted-scoring system across every field in `stack-data.ts`, which is a
substantial feature in its own right, or (b) faking it with an if-statement
that would just be misleading. If you want this to actually do something,
that's the next real feature to design — not a bug to patch.

## Security notes

- **SQL injection**: prevented structurally — Drizzle parameterizes every
  query; the two JSONB aggregate queries in `lib/admin/stats.ts` use `sql`
  template tags but remain fully parameterized (no string concatenation of
  user input).
- **Prompt injection**: delimiter-isolated user text + explicit "treat as
  data" instructions + hard field-overwrite for the one output class where
  an injection could cause real harm (EU hosting compliance).
- **CSRF**: Origin-header verification (see above) on every POST/PATCH
  route, layered on top of the `httpOnly` + `SameSite=lax` session cookie.
- **Admin/agency isolation**: `middleware.ts` verifies the JWT and checks
  role (and, for agency routes, the `agencySlug` claim) before any route
  handler or page runs. Agency API routes additionally verify the specific
  resource being modified actually belongs to that agency (defense in
  depth, in case the route is ever reached a different way).
- **Blueprint privacy**: addressed by a 128-bit random `shareToken`, never
  the sequential UUID primary key.
- **Lead consent**: `z.literal(true)` on `privacyConsent` — no falsy/default
  path passes validation without explicit consent.
- **Rate limiting**: fails open on Upstash outage (see `rate-limit.ts`);
  change the `checkRateLimit` catch block if your abuse profile needs fail-closed instead.

## What's still simplified (know this before real production use)

- **Admin/agency login** is deliberately minimal — email + bcrypt password,
  no MFA, no SSO, no password-reset flow. Real enough to exercise the
  JWT/middleware/ownership-check machinery end to end; swap for Supabase
  Auth/Clerk/NextAuth if you need more.
- **`lib/admin/stats.ts`** uses raw `sql` template tags for the two JSONB
  aggregate queries since Drizzle's query builder doesn't have first-class
  JSONB path syntax. Parameterized, just not using the fluent builder for
  those two queries.
- **GDPR deletion** removes `leads` rows and plain `role='user'` accounts by
  email. It does **not** delete `blueprints` rows (they're not keyed to an
  email — see the comment in the confirm page for the reasoning) or touch
  `partner_clicks`. Extend `app/privacy/delete-my-data/confirm/[token]/page.tsx`
  if your data-retention policy needs to go further.
- **Sentry** is scaffolded but never tested against a live Sentry project in
  this environment (no network access to sentry.io here) — the DSN-gating
  logic is sound, but verify the actual event delivery once you have a real
  DSN.
- **Quota is device-cookie based, not account based** (see the quota
  section above) — acceptable for cost control, not for anything requiring
  real per-person enforcement. No refund flow exists if a payment succeeds
  but credits need to be reversed (would currently require a manual Redis
  `DECRBY` + a note in `credit_purchases`); no receipt/invoice email is
  sent beyond Stripe's own default receipt.
- **Nothing here has touched a real Postgres/OpenAI/Upstash/Resend/Stripe
  instance.** `npm install`, `tsc`, `next lint`, `vitest`, and `next build`
  all pass in this environment — but no migration has been run against a
  live database, no `generateObject` call has actually been made, no PDF has
  actually been rendered, no email has actually been sent. That's the first
  thing to do with real credentials: walk the wizard → blueprint → PDF →
  lead → admin flow end to end once.

## Deploying this for real

I can't push this live myself — no network access from where this was built
to Vercel, a domain registrar, or your Stripe/OpenAI/Upstash/Resend
accounts. Here's the actual path to a live URL:

1. **Push this to a GitHub repo.** The CI workflow (`.github/workflows/ci.yml`)
   runs automatically on push — confirm it's green before deploying.
2. **Provision the real services**: Neon (or Supabase) Postgres, an OpenAI
   API key, an Upstash Redis database, a Resend account with a verified
   sending domain, and a Stripe account.
3. **Deploy to Vercel** (or any Next.js 15 host): import the repo, set every
   variable from `.env.example` in the project's environment settings
   (`DATABASE_URL`, `OPENAI_API_KEY`, `UPSTASH_REDIS_REST_URL`/`TOKEN`,
   `RESEND_API_KEY`, `ADMIN_ALERT_EMAIL`, `JWT_SECRET`,
   `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
   `instrumentation.ts` will refuse to boot if any required one is missing —
   that's intentional, so a broken deploy fails loudly instead of half-working.
4. **Point your domain at it**, then set `NEXT_PUBLIC_APP_URL` to that real
   domain and redeploy — OG images, the sitemap, email links, and Stripe's
   success/cancel URLs all depend on this being correct.
5. **Run migrations against the real database**: `npm run db:generate &&
   npm run db:migrate`, then `npm run db:seed -- you@yourdomain.com "..."`
   for your admin login.
6. **Register the Stripe webhook** pointing at
   `https://yourdomain.com/api/webhooks/stripe` for `checkout.session.completed`,
   copy its signing secret into `STRIPE_WEBHOOK_SECRET`, redeploy.
7. **Walk the full flow once for real**: generate a blueprint (uses 1 of
   your 2 free/day), exhaust the quota, buy the $10 pack with a real card
   (or Stripe test mode first), confirm credits land, download the PDF,
   submit a lead, confirm the email alert arrives, confirm it shows up in
   `/admin`.

Nothing above can be verified from this environment — steps 2–7 all require
accounts and network access I don't have here. Everything up to that point
(the code itself) is typechecked, linted, tested, and build-verified.
