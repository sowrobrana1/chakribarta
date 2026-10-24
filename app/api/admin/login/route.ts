import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  adminSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** POST { password } → sets the httpOnly admin session cookie. */
export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "অ্যাডমিন প্যানেল এখনো কনফিগার করা হয়নি (ADMIN_PASSWORD সেট করা নেই)।",
      },
      { status: 503 }
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    // fall through — empty password fails verification below
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      { error: "ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।" },
      { status: 401 }
    );
  }

  const token = adminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token as string, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

/** DELETE → logout (clears the session cookie). */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
