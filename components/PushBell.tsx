"use client";

import { useEffect, useState } from "react";

// The VAPID public key is public by design and inlined at build time.
// When it is not set, push is not configured yet and this button hides.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// VAPID public keys are base64url; PushManager wants raw bytes.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type State = "idle" | "working" | "on" | "unsupported" | "soon";

function BellSvg({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
      <path
        d="M12 3a5 5 0 0 0-5 5v3.6c0 .5-.2 1-.5 1.4L5 14.6c-.4.6.1 1.4.9 1.4h12.2c.8 0 1.3-.8.9-1.4l-1.5-1.6c-.3-.4-.5-.9-.5-1.4V8a5 5 0 0 0-5-5zm-2.2 14a2.3 2.3 0 0 0 4.4 0h-4.4z"
        fill={filled ? "#e9b23c" : "#ffffff"}
      />
    </svg>
  );
}

/**
 * "🔔 নতুন সার্কুলারের নোটিফিকেশন" subscribe bell for the masthead.
 *
 * Renders NOTHING until NEXT_PUBLIC_VAPID_PUBLIC_KEY is configured —
 * push activates together with the Supabase wiring (see README). In
 * local mode (no database) the subscribe call is answered with a
 * friendly "coming soon" payload and the bell shows that state instead
 * of pretending the subscription was stored.
 */
export default function PushBell() {
  const [state, setState] = useState<State>("idle");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then((reg) => (reg ? reg.pushManager.getSubscription() : null))
      .then((sub) => {
        if (sub) setState("on");
      })
      .catch(() => {});
  }, []);

  if (!VAPID_PUBLIC_KEY) return null;
  if (state === "unsupported") return null;

  async function enable() {
    if (state === "on" || state === "working") return;
    setState("working");
    setNote("");
    try {
      // Prefer the server key endpoint (same pattern as the news
      // sites); fall back to the build-time public key.
      let publicKey = VAPID_PUBLIC_KEY as string;
      try {
        const keyRes = await fetch("/api/push/key");
        const keyData = await keyRes.json();
        if (keyData.ok && keyData.publicKey) publicKey = keyData.publicKey;
      } catch {
        /* use the env key */
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("idle");
        setNote("নোটিফিকেশনের অনুমতি দেওয়া হয়নি।");
        return;
      }

      const registration =
        (await navigator.serviceWorker.getRegistration("/sw.js")) ??
        (await navigator.serviceWorker.register("/sw.js"));
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const payload = subscription.toJSON() as Record<string, unknown>;
      payload.categories = [];
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok && data.stored) {
        setState("on");
      } else if (data.ok && data.comingSoon) {
        setState("soon");
        setNote(
          data.message ??
            "নোটিফিকেশন সেবাটি শীঘ্রই চালু হচ্ছে।"
        );
      } else {
        setState("idle");
        setNote("চালু করা যায়নি। আবার চেষ্টা করুন।");
      }
    } catch {
      setState("idle");
      setNote("চালু করা যায়নি। আবার চেষ্টা করুন।");
    }
  }

  const label =
    state === "on"
      ? "নতুন সার্কুলারের নোটিফিকেশন চালু আছে"
      : state === "soon"
        ? "নোটিফিকেশন সেবা শীঘ্রই আসছে"
        : "নতুন সার্কুলারের নোটিফিকেশন চালু করুন";

  return (
    <span className="push-bell">
      <button
        type="button"
        className="bell-btn"
        onClick={enable}
        aria-label={label}
        title={label}
      >
        <span className="bell-wrap">
          <BellSvg filled={state === "on"} />
          {state !== "on" && <span className="bell-dot" />}
        </span>
      </button>
      {note && <span className="push-note" role="status">{note}</span>}
    </span>
  );
}
