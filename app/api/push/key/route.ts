import { NextResponse } from "next/server";
import { vapidPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * GET /api/push/key — the VAPID public key the browser needs to
 * subscribe (same pattern as the user's news sites). Answered from the
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY env var; 503 until the key pair is
 * generated and set (a deploy-time step — see README).
 */
export async function GET() {
  const publicKey = vapidPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { ok: false, error: "Push এখনো সেটআপ করা হয়নি।" },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true, publicKey });
}
