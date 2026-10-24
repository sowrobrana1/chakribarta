import Link from "next/link";
import type { Metadata } from "next";
import { isAdminAuthed, isAdminConfigured } from "@/lib/admin-auth";
import { adminListCirculars, computeAdminStats } from "@/lib/admin";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "অ্যাডমিন — ChakriBarta",
  description: "ChakriBarta অ্যাডমিন প্যানেল — সার্কুলার ব্যবস্থাপনা।",
  robots: { index: false, follow: false },
};

function AdminHeader() {
  return (
    <header className="app-header">
      <Link href="/" className="back-link" aria-label="ফিরে যান">
        ‹
      </Link>
      <span className="header-title">অ্যাডমিন প্যানেল</span>
      <span style={{ width: 30 }} />
    </header>
  );
}

export default async function AdminPage() {
  // Gate 1: panel not configured at all (no ADMIN_PASSWORD) — never
  // open access, just explain what is missing.
  if (!isAdminConfigured()) {
    return (
      <>
        <AdminHeader />
        <main className="admin-main">
          <div className="notice">
            <strong>অ্যাডমিন প্যানেল এখনো সেটআপ করা হয়নি।</strong>
            <br />
            চালু করতে server env var <code>ADMIN_PASSWORD</code> সেট করুন
            (Vercel → Project → Settings → Environment Variables), তারপর
            আবার deploy করুন। পাসওয়ার্ড সেট না থাকলে এই প্যানেলে কেউ
            লগইন করতে পারবে না।
          </div>
        </main>
      </>
    );
  }

  // Gate 2: configured but not logged in → password form.
  if (!isAdminAuthed()) {
    return (
      <>
        <AdminHeader />
        <main className="admin-main">
          <AdminLogin />
        </main>
      </>
    );
  }

  // Logged in → dashboard (Supabase full mode, or local read-only).
  const { source, items } = await adminListCirculars();
  const stats = computeAdminStats(items);

  return (
    <>
      <AdminHeader />
      <main className="admin-main">
        <AdminDashboard
          initialItems={items}
          initialStats={stats}
          source={source}
        />
      </main>
    </>
  );
}
