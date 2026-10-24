"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "লগইন করা যায়নি।");
        return;
      }
      router.refresh();
    } catch {
      setError("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-card">
      <h2 className="admin-card-title">অ্যাডমিন লগইন</h2>
      <p className="admin-muted">
        সার্কুলার যোগ/এডিট করতে অ্যাডমিন পাসওয়ার্ড দিয়ে লগইন করুন।
      </p>
      <form onSubmit={onSubmit} className="admin-form">
        <div className="form-field">
          <label htmlFor="admin-password">পাসওয়ার্ড</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "লগইন হচ্ছে…" : "লগইন"}
        </button>
      </form>
    </div>
  );
}
