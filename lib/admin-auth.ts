import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Admin authentication.
 *
 * The admin panel is gated by the ADMIN_PASSWORD env var, compared
 * server-side only. After a successful login POST the browser gets an
 * httpOnly cookie whose value is an HMAC of a fixed label keyed by the
 * password itself — so the cookie never contains the password, and
 * changing ADMIN_PASSWORD invalidates all existing sessions.
 *
 * If ADMIN_PASSWORD is not set, the admin panel is closed: no login is
 * possible and /admin only shows a "not configured" notice.
 */

export const ADMIN_COOKIE = "cb_admin_session";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Constant-time password check against the env var. */
export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !candidate) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The session token stored in the cookie (null when not configured). */
export function adminSessionToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw)
    .update("chakribarta-admin-session-v1")
    .digest("hex");
}

/** True when the current request carries a valid admin session cookie. */
export function isAdminAuthed(): boolean {
  const token = adminSessionToken();
  if (!token) return false;
  const cookie = cookies().get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;
  const a = Buffer.from(cookie);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
