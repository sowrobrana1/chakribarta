import { NextResponse } from "next/server";
import {
  parsePushSubscription,
  removePushSubscription,
  savePushSubscription,
} from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * POST /api/push/subscribe — register a Web Push subscription.
 *
 * Body: the browser's PushSubscription JSON
 *   { endpoint, keys: { p256dh, auth }, categories?: string[] }
 * or { action: "unsubscribe", endpoint }.
 *
 * Supabase mode: stored in `push_subscriptions`. Local mode (database
 * not wired yet): accepted but not stored anywhere durable — answered
 * with a friendly "coming soon" payload so the UI can say so honestly.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "ভুল ডাটা পাঠানো হয়েছে।" },
      { status: 400 }
    );
  }

  const b = (body ?? {}) as Record<string, unknown>;

  if (b.action === "unsubscribe") {
    const endpoint = typeof b.endpoint === "string" ? b.endpoint : "";
    if (!endpoint) {
      return NextResponse.json(
        { ok: false, error: "endpoint আবশ্যক।" },
        { status: 400 }
      );
    }
    const result = await removePushSubscription(endpoint);
    if (!result.stored && result.reason === "db-error") {
      return NextResponse.json(
        { ok: false, error: "সার্ভারে সমস্যা হয়েছে। পরে চেষ্টা করুন।" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, stored: result.stored });
  }

  const parsed = parsePushSubscription(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: 400 }
    );
  }

  const result = await savePushSubscription(parsed.value);
  if (!result.stored) {
    if (result.reason === "db-error") {
      return NextResponse.json(
        { ok: false, error: "সার্ভারে সমস্যা হয়েছে। পরে চেষ্টা করুন।" },
        { status: 500 }
      );
    }
    // Local mode — accepted, nothing durable stored yet.
    return NextResponse.json({
      ok: true,
      stored: false,
      comingSoon: true,
      message:
        "নোটিফিকেশন সেবাটি শীঘ্রই চালু হচ্ছে — চালু হলেই এখান থেকে সাবস্ক্রাইব করা যাবে।",
    });
  }

  return NextResponse.json({ ok: true, stored: true });
}
