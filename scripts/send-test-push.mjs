#!/usr/bin/env node
/**
 * Manual Web Push test for ChakriBarta.
 *
 * Sends one test notification to EVERY active row in the Supabase
 * `push_subscriptions` table (no category filtering), and deactivates
 * subscriptions whose push endpoint answers 404/410 (dead endpoints).
 *
 * Usage — set the same env vars the deployed app uses, then run:
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=... \
 *   VAPID_PRIVATE_KEY=... \
 *   node scripts/send-test-push.mjs
 *
 * Optional: VAPID_SUBJECT (defaults to the project contact mailto:).
 * This script is a manual diagnostic only — it is NOT wired into any
 * route or cron.
 */
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject =
  process.env.VAPID_SUBJECT || "mailto:sowrobhasanrana39@gmail.com";

const missing = [
  ["NEXT_PUBLIC_SUPABASE_URL", url],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceKey],
  ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", publicKey],
  ["VAPID_PRIVATE_KEY", privateKey],
]
  .filter(([, v]) => !v || v.trim() === "")
  .map(([k]) => k);

if (missing.length > 0) {
  console.error(`Missing env var(s): ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
webpush.setVapidDetails(subject, publicKey.trim(), privateKey.trim());

const { data, error } = await supabase
  .from("push_subscriptions")
  .select("id, token, subscription, categories")
  .eq("is_active", true)
  .limit(1000);

if (error) {
  console.error("Failed to read push_subscriptions:", error.message);
  process.exit(1);
}

const rows = data ?? [];
console.log(`Active subscriptions: ${rows.length}`);

const payload = JSON.stringify({
  title: "ChakriBarta — টেস্ট নোটিফিকেশন",
  body: "Push notification ঠিকমতো কাজ করছে। নতুন সার্কুলার এলেই এভাবে জানতে পারবেন।",
  url: "/",
  icon: "/icons/icon-192.png",
});

let sent = 0;
let deactivated = 0;
let skipped = 0;
let failed = 0;

for (const row of rows) {
  const sub = row.subscription ?? {};
  const endpoint = sub.endpoint || row.token;
  const keys = sub.keys ?? {};
  if (!endpoint || !keys.p256dh || !keys.auth) {
    skipped++;
    continue;
  }
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      payload
    );
    sent++;
  } catch (err) {
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      const { error: upErr } = await supabase
        .from("push_subscriptions")
        .update({ is_active: false })
        .eq("id", row.id);
      if (upErr) {
        console.error(`Could not deactivate ${row.id}:`, upErr.message);
        failed++;
      } else {
        deactivated++;
      }
    } else {
      failed++;
      console.error(
        `Send failed for ${row.id}:`,
        err?.statusCode ?? "",
        err?.body ?? err?.message ?? err
      );
    }
  }
}

console.log(
  `Done. sent=${sent} deactivated=${deactivated} skipped=${skipped} failed=${failed}`
);
