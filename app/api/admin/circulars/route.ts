import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import {
  adminCreateCircular,
  adminListCirculars,
  computeAdminStats,
  isDbAdminConfigured,
  parseCircularInput,
} from "@/lib/admin";
import { sendPushForCircular } from "@/lib/push-send";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { error: "লগইন করা নেই। আগে অ্যাডমিন হিসেবে লগইন করুন।" },
    { status: 401 }
  );
}

/** GET → full list (all statuses) + stats for the admin dashboard. */
export async function GET() {
  if (!isAdminAuthed()) return unauthorized();
  const { source, items } = await adminListCirculars();
  return NextResponse.json({
    source,
    dbConfigured: isDbAdminConfigured(),
    items,
    stats: computeAdminStats(items),
  });
}

/** POST → create a circular (Supabase mode only). */
export async function POST(request: Request) {
  if (!isAdminAuthed()) return unauthorized();
  if (!isDbAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Database (Supabase) এখনো সংযুক্ত নয় — সার্কুলার যোগ করতে SUPABASE_SERVICE_ROLE_KEY সেট করুন।",
      },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "ভুল ডাটা পাঠানো হয়েছে।" },
      { status: 400 }
    );
  }

  const parsed = parseCircularInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const item = await adminCreateCircular(parsed.value);
    // New live circular → notify push subscribers. Only on CREATE with
    // status "active" (never on drafts, edits, or sample rows). The
    // sender is fail-soft; the extra catch is belt-and-braces so a push
    // problem can never fail the create itself.
    if (item.status === "active" && !item.is_sample) {
      await sendPushForCircular(item).catch(() => {});
    }
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "সেভ করা যায়নি।" },
      { status: 500 }
    );
  }
}
