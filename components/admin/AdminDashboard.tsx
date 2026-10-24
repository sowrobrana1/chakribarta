"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminSource, AdminStats } from "@/lib/admin";
import { DB_CATEGORIES, type Circular } from "@/lib/types";
import { formatBnDate, toBn } from "@/lib/format";

interface Props {
  initialItems: Circular[];
  initialStats: AdminStats;
  source: AdminSource;
}

interface FormState {
  org: string;
  title: string;
  category: string;
  posts_count: string;
  salary: string;
  education: string;
  location: string;
  published_date: string;
  deadline: string;
  source_url: string;
  apply_url: string;
  image_url: string;
  status: string;
  is_sample: boolean;
}

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function emptyForm(): FormState {
  return {
    org: "",
    title: "",
    category: DB_CATEGORIES[0],
    posts_count: "",
    salary: "",
    education: "",
    location: "",
    published_date: todayISO(),
    deadline: todayISO(),
    source_url: "",
    apply_url: "",
    image_url: "",
    status: "active",
    is_sample: false,
  };
}

function formFrom(item: Circular): FormState {
  return {
    org: item.org,
    title: item.title,
    category: item.category,
    posts_count: item.posts_count === null ? "" : String(item.posts_count),
    salary: item.salary ?? "",
    education: item.education ?? "",
    location: item.location ?? "",
    published_date: item.published_date,
    deadline: item.deadline,
    source_url: item.source_url ?? "",
    apply_url: item.apply_url ?? "",
    image_url: item.image_url ?? "",
    status: item.status,
    is_sample: item.is_sample,
  };
}

const STATUS_LABELS: Record<string, string> = {
  active: "সক্রিয়",
  draft: "খসড়া",
  expired: "মেয়াদ শেষ",
};

export default function AdminDashboard({
  initialItems,
  initialStats,
  source,
}: Props) {
  const router = useRouter();
  const dbMode = source === "supabase";
  const [items, setItems] = useState<Circular[]>(initialItems);
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/circulars");
    if (!res.ok) return;
    const data = (await res.json()) as {
      items: Circular[];
      stats: AdminStats;
    };
    setItems(data.items);
    setStats(data.stats);
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  }

  function startEdit(item: Circular) {
    setEditingId(item.id);
    setForm(formFrom(item));
    setError(null);
    setShowForm(true);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const payload = {
      ...form,
      posts_count: form.posts_count === "" ? null : Number(form.posts_count),
    };

    try {
      const url = editingId
        ? `/api/admin/circulars/${encodeURIComponent(editingId)}`
        : "/api/admin/circulars";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "সেভ করা যায়নি।");
        return;
      }
      setNotice(editingId ? "সার্কুলার আপডেট হয়েছে।" : "নতুন সার্কুলার যোগ হয়েছে।");
      setShowForm(false);
      setEditingId(null);
      await refresh();
    } catch {
      setError("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(item: Circular) {
    if (
      !window.confirm(
        `“${item.org} — ${item.title}” ডিলিট করবেন? এটি ফেরত আনা যাবে না।`
      )
    ) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/admin/circulars/${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "ডিলিট করা যায়নি।");
        return;
      }
      setNotice("সার্কুলার ডিলিট হয়েছে।");
      await refresh();
    } catch {
      setError("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।");
    }
  }

  return (
    <>
      {!dbMode && (
        <div className="notice">
          <strong>Read-only মোড:</strong> Database (Supabase) এখনো সংযুক্ত নয়,
          তাই তালিকাটি local data থেকে শুধু দেখা যাচ্ছে। সার্কুলার যোগ/এডিট/ডিলিট
          চালু করতে Supabase project তৈরি করে{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> ও{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> env var সেট করুন।
        </div>
      )}

      <section className="admin-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">পরিসংখ্যান</h2>
          <button type="button" className="btn-small" onClick={logout}>
            লগআউট
          </button>
        </div>
        <div className="stats-strip">
          <div className="stat-box">
            <div className="stat-num">{toBn(stats.total)}</div>
            <div className="stat-label">মোট সার্কুলার</div>
          </div>
          <div className="stat-box">
            <div className="stat-num urgent-num">{toBn(stats.expiringSoon)}</div>
            <div className="stat-label">৭ দিনের মধ্যে শেষ হচ্ছে</div>
          </div>
        </div>
        <div className="cat-counts">
          {Object.entries(stats.byCategory).map(([cat, n]) => (
            <span key={cat} className="tag">
              {cat}: {toBn(n)}
            </span>
          ))}
        </div>
        <div className="cat-counts">
          {Object.entries(stats.byStatus).map(([st, n]) => (
            <span key={st} className="tag">
              {STATUS_LABELS[st] ?? st}: {toBn(n)}
            </span>
          ))}
        </div>
      </section>

      {error && <p className="admin-error">{error}</p>}
      {notice && <p className="admin-success">{notice}</p>}

      {dbMode && !showForm && (
        <button type="button" className="btn-primary" onClick={startAdd}>
          + নতুন সার্কুলার যোগ করুন
        </button>
      )}

      {dbMode && showForm && (
        <section className="admin-card">
          <h2 className="admin-card-title">
            {editingId ? "সার্কুলার এডিট" : "নতুন সার্কুলার"}
          </h2>
          <form onSubmit={onSubmit} className="admin-form">
            <div className="form-field">
              <label htmlFor="f-org">প্রতিষ্ঠানের নাম *</label>
              <input
                id="f-org"
                value={form.org}
                onChange={(e) => set("org", e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="f-title">পদের নাম / শিরোনাম *</label>
              <input
                id="f-title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </div>
            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="f-category">ক্যাটাগরি *</label>
                <select
                  id="f-category"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {DB_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="f-status">স্ট্যাটাস</label>
                <select
                  id="f-status"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option value="active">সক্রিয় (active)</option>
                  <option value="draft">খসড়া (draft)</option>
                  <option value="expired">মেয়াদ শেষ (expired)</option>
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="f-posts">পদসংখ্যা</label>
                <input
                  id="f-posts"
                  type="number"
                  min="0"
                  value={form.posts_count}
                  onChange={(e) => set("posts_count", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="f-location">কর্মস্থল</label>
                <input
                  id="f-location"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="f-salary">বেতন</label>
              <input
                id="f-salary"
                value={form.salary}
                onChange={(e) => set("salary", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="f-education">যোগ্যতা</label>
              <input
                id="f-education"
                value={form.education}
                onChange={(e) => set("education", e.target.value)}
              />
            </div>
            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="f-pub">প্রকাশের তারিখ *</label>
                <input
                  id="f-pub"
                  type="date"
                  value={form.published_date}
                  onChange={(e) => set("published_date", e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="f-deadline">আবেদনের শেষ তারিখ *</label>
                <input
                  id="f-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="f-apply">Apply লিংক</label>
              <input
                id="f-apply"
                type="url"
                value={form.apply_url}
                onChange={(e) => set("apply_url", e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="form-field">
              <label htmlFor="f-source">Source লিংক (মূল বিজ্ঞপ্তি)</label>
              <input
                id="f-source"
                type="url"
                value={form.source_url}
                onChange={(e) => set("source_url", e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="form-field">
              <label htmlFor="f-image">সার্কুলার ছবির লিংক</label>
              <input
                id="f-image"
                type="url"
                value={form.image_url}
                onChange={(e) => set("image_url", e.target.value)}
                placeholder="https://…"
              />
            </div>
            <label className="form-check">
              <input
                type="checkbox"
                checked={form.is_sample}
                onChange={(e) => set("is_sample", e.target.checked)}
              />
              নমুনা (sample) সার্কুলার
            </label>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "সেভ হচ্ছে…" : "সেভ করুন"}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                বাতিল
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-card">
        <h2 className="admin-card-title">
          সব সার্কুলার ({toBn(items.length)})
        </h2>
        {items.length === 0 ? (
          <p className="admin-muted">এখনো কোনো সার্কুলার নেই।</p>
        ) : (
          <div className="admin-list">
            {items.map((item) => (
              <article key={item.id} className="admin-item">
                <div className="admin-item-main">
                  <div className="job-card-top">
                    <span className="tag">{item.category}</span>
                    <span
                      className={`tag status-${item.status}`}
                    >
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  <h3 className="admin-item-org">{item.org}</h3>
                  <p className="job-title">{item.title}</p>
                  <p className="job-meta">
                    শেষ তারিখ: {formatBnDate(item.deadline)} • প্রকাশ:{" "}
                    {formatBnDate(item.published_date)}
                    {item.posts_count !== null &&
                      ` • পদ: ${toBn(item.posts_count)}টি`}
                  </p>
                </div>
                {dbMode && (
                  <div className="admin-item-actions">
                    <button
                      type="button"
                      className="btn-small"
                      onClick={() => startEdit(item)}
                    >
                      এডিট
                    </button>
                    <button
                      type="button"
                      className="btn-small btn-danger"
                      onClick={() => onDelete(item)}
                    >
                      ডিলিট
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
