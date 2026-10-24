import { getServiceSupabase } from "./admin";

/**
 * Web Push subscription storage.
 *
 * Follows the same data-layer switch as lib/admin.ts:
 *  - Supabase mode (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *    set): subscriptions are stored in the `push_subscriptions` table
 *    (platform "web", token = push endpoint, subscription = the full
 *    Web Push subscription JSON, categories = subscribed categories,
 *    empty = all).
 *  - Local mode (no database yet): nothing durable is stored — the API
 *    route answers with a friendly "coming soon" payload so the UI can
 *    show that state instead of pretending.
 *
 * VAPID keys come from env only:
 *  - NEXT_PUBLIC_VAPID_PUBLIC_KEY (public, shipped to the browser)
 *  - VAPID_PRIVATE_KEY (server-only, used later by the sender)
 * Generating the key pair is a deployment step (see README) — it happens
 * together with the Supabase wiring; no keys live in this repo.
 */

export function vapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  return key && key.trim() !== "" ? key.trim() : null;
}

/** True when a VAPID pair is present (subscribe UI may be shown). */
export function isPushConfigured(): boolean {
  return Boolean(vapidPublicKey() && process.env.VAPID_PRIVATE_KEY);
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  categories: string[];
}

const CATEGORY_SET = new Set([
  "সরকারি",
  "ব্যাংক",
  "NGO",
  "প্রাইভেট",
  "শিক্ষক",
  "প্রতিরক্ষা",
  "ফলাফল",
]);

/** Validate + normalize a Web Push subscription posted by the browser. */
export function parsePushSubscription(
  body: unknown
): { ok: true; value: PushSubscriptionInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "ভুল ডাটা পাঠানো হয়েছে।" };
  }
  const b = body as Record<string, unknown>;

  const endpoint =
    typeof b.endpoint === "string" && b.endpoint.startsWith("https://")
      ? b.endpoint
      : null;
  if (!endpoint) {
    return { ok: false, error: "সঠিক push endpoint পাওয়া যায়নি।" };
  }

  const keys = (b.keys ?? {}) as Record<string, unknown>;
  const p256dh = typeof keys.p256dh === "string" ? keys.p256dh : "";
  const auth = typeof keys.auth === "string" ? keys.auth : "";
  if (!p256dh || !auth) {
    return { ok: false, error: "Push keys পাওয়া যায়নি।" };
  }

  const categories = Array.isArray(b.categories)
    ? b.categories
        .filter(
          (c): c is string => typeof c === "string" && CATEGORY_SET.has(c)
        )
        .slice(0, 7)
    : [];

  return { ok: true, value: { endpoint, keys: { p256dh, auth }, categories } };
}

export type SavePushResult =
  | { stored: true }
  | { stored: false; reason: "local" | "db-error" };

/** Store (or refresh) a subscription in the active data layer. */
export async function savePushSubscription(
  input: PushSubscriptionInput
): Promise<SavePushResult> {
  const svc = getServiceSupabase();
  if (!svc) return { stored: false, reason: "local" };

  const { error } = await svc.from("push_subscriptions").upsert(
    {
      platform: "web",
      token: input.endpoint,
      subscription: {
        endpoint: input.endpoint,
        keys: input.keys,
      },
      categories: input.categories,
      is_active: true,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token" }
  );

  if (error) {
    console.error("savePushSubscription failed:", error.message);
    return { stored: false, reason: "db-error" };
  }
  return { stored: true };
}

/** Mark a subscription inactive (unsubscribe). */
export async function removePushSubscription(
  endpoint: string
): Promise<SavePushResult> {
  const svc = getServiceSupabase();
  if (!svc) return { stored: false, reason: "local" };

  const { error } = await svc
    .from("push_subscriptions")
    .update({ is_active: false })
    .eq("token", endpoint);

  if (error) {
    console.error("removePushSubscription failed:", error.message);
    return { stored: false, reason: "db-error" };
  }
  return { stored: true };
}
