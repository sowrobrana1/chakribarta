import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import {
  adminDeleteCircular,
  adminUpdateCircular,
  isDbAdminConfigured,
  parseCircularInput,
} from "@/lib/admin";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { error: "লগইন করা নেই। আগে অ্যাডমিন হিসেবে লগইন করুন।" },
    { status: 401 }
  );
}

function dbRequired() {
  return NextResponse.json(
    {
      error:
        "Database (Supabase) এখনো সংযুক্ত নয় — এডিট/ডিলিট করতে SUPABASE_SERVICE_ROLE_KEY সেট করুন।",
    },
    { status: 400 }
  );
}

/** PUT → update one circular (Supabase mode only). */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauthorized();
  if (!isDbAdminConfigured()) return dbRequired();

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
    const item = await adminUpdateCircular(params.id, parsed.value);
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "আপডেট করা যায়নি।" },
      { status: 500 }
    );
  }
}

/** DELETE → delete one circular (Supabase mode only). */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauthorized();
  if (!isDbAdminConfigured()) return dbRequired();

  try {
    await adminDeleteCircular(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ডিলিট করা যায়নি।" },
      { status: 500 }
    );
  }
}
