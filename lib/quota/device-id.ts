import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const DEVICE_ID_COOKIE = "sp_device";

/**
 * Anonymous per-browser identity for quota tracking. Founders don't have
 * accounts (blueprints are addressed by shareToken, not a login), so "2
 * free per day" has to be tied to *something* — a long-lived random cookie,
 * set on first visit and read back on every generation request.
 *
 * Known limitation, stated plainly: this is trivially resettable by
 * clearing cookies or using a private/incognito window, and doesn't follow
 * a user across devices. It's the right tradeoff for "stop the AI bill from
 * one browser tab looping the wizard," not a defense against a determined
 * free-tier abuser — see README for the IP-based backstop that covers that
 * gap instead.
 */
export async function getOrCreateDeviceId(): Promise<{ id: string; isNew: boolean }> {
  const store = await cookies();
  const existing = store.get(DEVICE_ID_COOKIE)?.value;
  if (existing && /^[0-9a-f]{32}$/.test(existing)) {
    return { id: existing, isNew: false };
  }
  const id = randomBytes(16).toString("hex");
  store.set(DEVICE_ID_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400, // ~13 months — long-lived, not session-only
  });
  return { id, isNew: true };
}
