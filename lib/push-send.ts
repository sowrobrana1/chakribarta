import webpush from "web-push";
import { getServiceSupabase } from "./admin";
import { vapidPublicKey } from "./push";
import type { Circular } from "./types";

/**
 * Web Push SENDER — notify subscribers when a new circular goes live.
 *
 * Mirrors the working sender in the news-portal ingest route: one payload
 * to every matching subscriber via Promise.allSettled, dead endpoints
 * (404/410 from the push service) pruned, and FULLY fail-soft — a push
 * problem must never fail the action that triggered it, so this function
 * catches everything and never throws.
 *
 * Data layer: the service-role Supabase client from lib/admin.ts reads
 * the `push_subscriptions` table written by lib/push.ts. A row matches
 * when its `categories` list is empty (= all categories) or contains the
 * circular's category. Only web rows carrying a full subscription object
 * (endpoint + keys) can receive Web Push; anything else is skipped.
 *
 * VAPID keys come from env (NEXT_PUBLIC_VAPID_PUBLIC_KEY +
 * VAPID_PRIVATE_KEY); without them — or without a database — the sender
 * stays silently inert, exactly like the rest of the push stack.
 */

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:sowrobhasanrana39@gmail.com";

const MAX_SUBSCRIPTIONS = 1000;

interface PushSubscriptionRow {
  id: string;
  token: string;
  subscription: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;
  categories: string[] | null;
}

/**
 * Send a "new circular" notification for `circular` to all matching
 * active subscriptions. Never throws.
 */
export async function sendPushForCircular(circular: Circular): Promise<void> {
  try {
    const publicKey = vapidPublicKey();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    if (!publicKey || !privateKey) return; // Push not configured yet.

    const svc = getServiceSupabase();
    if (!svc) return; // Local mode — no subscription store to read.

    const { data, error } = await svc
      .from("push_subscriptions")
      .select("id, token, subscription, categories")
      .eq("is_active", true)
      .limit(MAX_SUBSCRIPTIONS);
    if (error) {
      console.error(
        "sendPushForCircular: subscription fetch failed:",
        error.message
      );
      return;
    }

    const targets = ((data ?? []) as PushSubscriptionRow[]).filter((row) => {
      const cats = Array.isArray(row.categories) ? row.categories : [];
      return cats.length === 0 || cats.includes(circular.category);
    });
    if (targets.length === 0) return;

    webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey);

    const payload = JSON.stringify({
      title: circular.org,
      body: circular.title,
      url: `/job/${circular.id}`,
      icon: "/icons/icon-192.png",
    });

    await Promise.allSettled(
      targets.map(async (row) => {
        const sub = row.subscription ?? {};
        const endpoint = sub.endpoint || row.token;
        const keys = sub.keys ?? {};
        if (!endpoint || !keys.p256dh || !keys.auth) return;
        try {
          await webpush.sendNotification(
            { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
            payload
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: unknown })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            // Dead endpoint — deactivate so we stop trying it.
            await svc
              .from("push_subscriptions")
              .update({ is_active: false })
              .eq("id", row.id);
          }
        }
      })
    );
  } catch (err) {
    console.error("sendPushForCircular failed:", err);
  }
}
