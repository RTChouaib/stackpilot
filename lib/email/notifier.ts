import { Resend } from "resend";
import type { Lead } from "@/lib/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

interface LeadAlertParams {
  lead: Pick<Lead, "leadType" | "fullName" | "email" | "targetBudget" | "targetTimeline" | "notes">;
  blueprintShareToken?: string;
  projectName: string;
}

const LEAD_TYPE_LABELS: Record<string, string> = {
  mvp_quote: "MVP quote request",
  builder_match: "Builder match request",
  newsletter: "Newsletter / email capture",
  contact: "Contact form message",
};

function renderLeadAlertHtml(params: LeadAlertParams): string {
  const { lead, blueprintShareToken, projectName } = params;
  const blueprintUrl = blueprintShareToken ? `${process.env.NEXT_PUBLIC_APP_URL}/blueprint/${blueprintShareToken}` : null;
  const typeLabel = LEAD_TYPE_LABELS[lead.leadType] ?? lead.leadType;

  const row = (label: string, value: string | null | undefined) =>
    value
      ? `<tr><td style="padding:6px 12px;color:#545E7D;font-size:13px;">${label}</td><td style="padding:6px 12px;font-weight:600;">${escapeHtml(value)}</td></tr>`
      : "";

  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#F6F7FB;padding:32px;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E1E4F0;overflow:hidden;">
      <div style="background:#10193A;color:#fff;padding:20px 24px;">
        <p style="margin:0;font-size:13px;opacity:0.7;">STACKPILOT · NEW LEAD</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:700;">${typeLabel}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${row("Product", projectName)}
        ${row("Name", lead.fullName)}
        ${row("Email", lead.email)}
        ${row("Budget", lead.targetBudget)}
        ${row("Timeline", lead.targetTimeline)}
        ${row("Notes", lead.notes)}
      </table>
      ${
        blueprintUrl
          ? `<div style="padding:20px 24px;">
        <a href="${blueprintUrl}" style="display:inline-block;background:#4C5FF0;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px;font-weight:600;">
          View blueprint
        </a>
      </div>`
          : ""
      }
    </div>
  </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends the double opt-in confirmation link for a GDPR data-deletion
 * request. Shares the Resend client with sendLeadAlertEmail rather than
 * each caller instantiating its own.
 */
export async function sendDeletionConfirmationEmail(email: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/privacy/delete-my-data/confirm/${token}`;
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "StackPilot <alerts@stackpilot.app>",
      to: email,
      subject: "Confirm your data deletion request — StackPilot",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;padding:24px;">
          <p>We received a request to delete all StackPilot data associated with this email address.</p>
          <p>If this was you, confirm below. This link expires once used and cannot be undone.</p>
          <p><a href="${confirmUrl}" style="display:inline-block;background:#10193A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;">Confirm deletion</a></p>
          <p style="color:#545E7D;font-size:13px;">If you didn't request this, you can ignore this email — nothing will be deleted.</p>
        </div>`,
    });
    return { ok: true };
  } catch (error) {
    console.error("[sendDeletionConfirmationEmail] Failed to send:", error);
    return { ok: false, error: error instanceof Error ? error.message : "unknown error" };
  }
}

/**
 * Fires a lead alert email to the admin inbox. Intentionally
 * non-blocking-safe: the caller (the /api/leads route handler) should await
 * this but treat a failure as non-fatal — the lead is already persisted in
 * Postgres by the time this runs, so an email outage should never lose a
 * lead, only delay the notification.
 */
export async function sendLeadAlertEmail(params: LeadAlertParams): Promise<{ ok: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) {
    console.warn("[sendLeadAlertEmail] ADMIN_ALERT_EMAIL not set — skipping email.");
    return { ok: false, error: "ADMIN_ALERT_EMAIL not configured" };
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "StackPilot <alerts@stackpilot.app>",
      to: adminEmail,
      subject: `New ${LEAD_TYPE_LABELS[params.lead.leadType] ?? "lead"} — ${params.projectName}`,
      html: renderLeadAlertHtml(params),
    });
    return { ok: true };
  } catch (error) {
    console.error("[sendLeadAlertEmail] Failed to send:", error);
    return { ok: false, error: error instanceof Error ? error.message : "unknown error" };
  }
}
