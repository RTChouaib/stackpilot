import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ============================================================
   ENUMS
   ============================================================ */

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "partner_agency"]);

export const leadTypeEnum = pgEnum("lead_type", ["mvp_quote", "builder_match", "newsletter", "contact"]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "matched",
  "converted",
  "closed",
]);

export const deletionRequestStatusEnum = pgEnum("deletion_request_status", [
  "pending",
  "confirmed",
  "completed",
]);

/* ============================================================
   USERS
   ============================================================ */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("user"),
  // Only set for admin / partner_agency users, who authenticate through
  // app/api/admin/login. Regular founders never get a password — their
  // blueprints are addressed by the unguessable shareToken instead.
  passwordHash: text("password_hash"),
  // Set only for role = 'partner_agency'. Scopes that user's admin-style
  // dashboard view to leads/blueprints belonging to their agency.
  agencyId: uuid("agency_id").references((): typeof agencies.id => agencies.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   AGENCIES (white-label)
   ============================================================ */

export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(), // used in /w/[slug] branded wizard URLs
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  accentColor: text("accent_color"), // hex, defaults to StackPilot blue if unset
  contactEmail: text("contact_email").notNull(),
  plan: text("plan").notNull().default("starter"), // "starter" | "growth" | "enterprise"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   BLUEPRINTS
   ============================================================ */

export const blueprints = pgTable(
  "blueprints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    // Set when this blueprint was generated through an agency's branded
    // wizard (/w/[slug]). Null for direct stackpilot.app visitors.
    agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
    // 128-bit (32 hex char) unguessable token — this is the public identifier,
    // never the primary key, so blueprint URLs can't be enumerated.
    shareToken: text("share_token").notNull().unique(),
    projectName: text("project_name").notNull(),
    // Raw questionnaire answers, sanitized before storage.
    rawInputs: jsonb("raw_inputs").notNull(),
    // The three generated stack tiers (lean / balanced / scale), matches BlueprintSchema.
    recommendations: jsonb("recommendations").notNull(),
    // AI task -> model recommendation matrix, matches AiSetupSchema.
    aiSetup: jsonb("ai_setup"),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    shareTokenIdx: index("blueprints_share_token_idx").on(table.shareToken),
    createdAtIdx: index("blueprints_created_at_idx").on(table.createdAt),
    agencyIdIdx: index("blueprints_agency_id_idx").on(table.agencyId),
  })
);

/* ============================================================
   LEADS
   ============================================================ */

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }),
    leadType: leadTypeEnum("lead_type").notNull(),
    fullName: text("full_name"),
    email: text("email").notNull(),
    notes: text("notes"),
    targetBudget: text("target_budget"),
    targetTimeline: text("target_timeline"),
    status: leadStatusEnum("status").notNull().default("new"),
    privacyConsent: boolean("privacy_consent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    leadTypeIdx: index("leads_lead_type_idx").on(table.leadType),
    statusIdx: index("leads_status_idx").on(table.status),
    // Added: joins against blueprintId (admin dashboard, CSV export) and
    // lookups by email (GDPR deletion requests) were doing sequential scans
    // without these.
    blueprintIdIdx: index("leads_blueprint_id_idx").on(table.blueprintId),
    emailIdx: index("leads_email_idx").on(table.email),
  })
);

/* ============================================================
   PARTNER CLICKS
   ============================================================ */

export const partnerClicks = pgTable(
  "partner_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(),
    affiliateUrl: text("affiliate_url"),
    clickedAt: timestamp("clicked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    blueprintIdIdx: index("partner_clicks_blueprint_id_idx").on(table.blueprintId),
  })
);

/* ============================================================
   PARTNER TOOLS (admin-managed labeling — never changes the
   underlying recommendation, only the "Partner recommendation"
   label shown in the monetization funnel)
   ============================================================ */

export const partnerTools = pgTable("partner_tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolName: text("tool_name").notNull().unique(),
  isPartner: boolean("is_partner").notNull().default(false),
  affiliateUrl: text("affiliate_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   RECOMMENDATION SETTINGS (illustrative admin controls — a
   single-row settings table; NOT wired into the deterministic
   engine or the AI prompt. See README for why.)
   ============================================================ */

export const recommendationSettings = pgTable("recommendation_settings", {
  id: integer("id").primaryKey().default(1), // enforced single row via app-level upsert-by-id=1
  costWeight: integer("cost_weight").notNull().default(50), // 0-100
  speedWeight: integer("speed_weight").notNull().default(50),
  qualityWeight: integer("quality_weight").notNull().default(50),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   GDPR DELETION REQUESTS
   ============================================================ */

export const deletionRequests = pgTable(
  "deletion_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    status: deletionRequestStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    tokenIdx: index("deletion_requests_token_idx").on(table.token),
    emailIdx: index("deletion_requests_email_idx").on(table.email),
  })
);

/* ============================================================
   RELATIONS
   ============================================================ */

export const usersRelations = relations(users, ({ one, many }) => ({
  blueprints: many(blueprints),
  agency: one(agencies, { fields: [users.agencyId], references: [agencies.id] }),
}));

export const agenciesRelations = relations(agencies, ({ many }) => ({
  users: many(users),
  blueprints: many(blueprints),
}));

export const blueprintsRelations = relations(blueprints, ({ one, many }) => ({
  user: one(users, { fields: [blueprints.userId], references: [users.id] }),
  agency: one(agencies, { fields: [blueprints.agencyId], references: [agencies.id] }),
  leads: many(leads),
  partnerClicks: many(partnerClicks),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  blueprint: one(blueprints, { fields: [leads.blueprintId], references: [blueprints.id] }),
}));

export const partnerClicksRelations = relations(partnerClicks, ({ one }) => ({
  blueprint: one(blueprints, { fields: [partnerClicks.blueprintId], references: [blueprints.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Agency = typeof agencies.$inferSelect;
export type NewAgency = typeof agencies.$inferInsert;
export type Blueprint = typeof blueprints.$inferSelect;
export type NewBlueprint = typeof blueprints.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type PartnerClick = typeof partnerClicks.$inferSelect;
export type PartnerTool = typeof partnerTools.$inferSelect;
export type RecommendationSettings = typeof recommendationSettings.$inferSelect;
export type DeletionRequest = typeof deletionRequests.$inferSelect;
