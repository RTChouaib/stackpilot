CREATE TYPE "public"."deletion_request_status" AS ENUM('pending', 'confirmed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'matched', 'converted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."lead_type" AS ENUM('mvp_quote', 'builder_match', 'newsletter', 'contact');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'partner_agency');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"accent_color" text,
	"contact_email" text NOT NULL,
	"plan" text DEFAULT 'starter' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blueprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"agency_id" uuid,
	"share_token" text NOT NULL,
	"project_name" text NOT NULL,
	"raw_inputs" jsonb NOT NULL,
	"recommendations" jsonb NOT NULL,
	"ai_setup" jsonb,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprints_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" text NOT NULL,
	"stripe_session_id" text NOT NULL,
	"amount_usd_cents" integer NOT NULL,
	"credits_granted" integer NOT NULL,
	"customer_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_purchases_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"status" "deletion_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "deletion_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid,
	"lead_type" "lead_type" NOT NULL,
	"full_name" text,
	"email" text NOT NULL,
	"notes" text,
	"target_budget" text,
	"target_timeline" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"privacy_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid,
	"tool_name" text NOT NULL,
	"affiliate_url" text,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_name" text NOT NULL,
	"is_partner" boolean DEFAULT false NOT NULL,
	"affiliate_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_tools_tool_name_unique" UNIQUE("tool_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recommendation_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"cost_weight" integer DEFAULT 50 NOT NULL,
	"speed_weight" integer DEFAULT 50 NOT NULL,
	"quality_weight" integer DEFAULT 50 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"password_hash" text,
	"agency_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partner_clicks" ADD CONSTRAINT "partner_clicks_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blueprints_share_token_idx" ON "blueprints" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blueprints_created_at_idx" ON "blueprints" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blueprints_agency_id_idx" ON "blueprints" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_purchases_device_id_idx" ON "credit_purchases" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_purchases_stripe_session_id_idx" ON "credit_purchases" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deletion_requests_token_idx" ON "deletion_requests" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deletion_requests_email_idx" ON "deletion_requests" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_lead_type_idx" ON "leads" USING btree ("lead_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_blueprint_id_idx" ON "leads" USING btree ("blueprint_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_clicks_blueprint_id_idx" ON "partner_clicks" USING btree ("blueprint_id");