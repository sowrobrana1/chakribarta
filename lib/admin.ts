import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getLocalCircularsAll, normalizeCircular } from "./data";
import { DB_CATEGORIES, type Circular, type CircularStatus } from "./types";

/**
 * Admin data layer.
 *
 * Two modes, switched purely by env vars:
 *  - "supabase": NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *    are set → full read/write against the `circulars` table with the
 *    service-role key (bypasses RLS; server-side only, never shipped
 *    to the browser).
 *  - "local": otherwise → read-only view of data/circulars.json so the
 *    panel is still useful before the database exists. Create/edit/
 *    delete return a clear error in this mode.
 */

export type AdminSource = "supabase" | "local";

const VALID_STATUSES: ReadonlyArray<CircularStatus> = [
  "active",
  "expired",
  "draft",
];

export function isDbAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function adminSource(): AdminSource {
  return isDbAdminConfigured() ? "supabase" : "local";
}

let serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient | null {
  if (!isDbAdminConfigured()) return null;
  if (!serviceClient) {
    serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return serviceClient;
}

function sortNewestFirst(items: Circular[]): Circular[] {
  return items.sort((a, b) => {
    if (a.published_date !== b.published_date) {
      return a.published_date < b.published_date ? 1 : -1;
    }
    return a.created_at < b.created_at ? 1 : -1;
  });
}

/** All circulars (every status), newest first, from the active source. */
export async function adminListCirculars(): Promise<{
  source: AdminSource;
  items: Circular[];
}> {
  const svc = getServiceSupabase();
  if (svc) {
    try {
      const { data, error } = await svc
        .from("circulars")
        .select("*")
        .order("published_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw new Error(error.message);
      const items = (data ?? [])
        .map((row, i) =>
          normalizeCircular(row as Record<string, unknown>, i)
        )
        .filter((c): c is Circular => c !== null);
      return { source: "supabase", items: sortNewestFirst(items) };
    } catch (err) {
      console.error("adminListCirculars (supabase) failed:", err);
      // Fall through to the local read-only view rather than a dead panel.
    }
  }
  return { source: "local", items: sortNewestFirst(await getLocalCircularsAll()) };
}

/* ------------------------- stats ------------------------- */

export interface AdminStats {
  total: number;
  /** Active circulars whose deadline is today..today+7. */
  expiringSoon: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

function todayPlusISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeAdminStats(items: Circular[]): AdminStats {
  const byCategory: Record<string, number> = {};
  for (const cat of DB_CATEGORIES) byCategory[cat] = 0;
  const byStatus: Record<string, number> = {
    active: 0,
    draft: 0,
    expired: 0,
  };
  const today = todayPlusISO(0);
  const week = todayPlusISO(7);
  let expiringSoon = 0;

  for (const c of items) {
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    if (c.status === "active" && c.deadline >= today && c.deadline <= week) {
      expiringSoon += 1;
    }
  }
  return { total: items.length, expiringSoon, byCategory, byStatus };
}

/* ------------------------- writes ------------------------- */

export interface CircularInput {
  org: string;
  title: string;
  category: string;
  posts_count: number | null;
  salary: string | null;
  education: string | null;
  location: string | null;
  published_date: string;
  deadline: string;
  source_url: string | null;
  apply_url: string | null;
  image_url: string | null;
  status: CircularStatus;
  is_sample: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function optString(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function reqString(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/** Validate + normalize an add/edit payload from the admin form. */
export function parseCircularInput(
  body: unknown
): { ok: true; value: CircularInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "ভুল ডাটা পাঠানো হয়েছে।" };
  }
  const b = body as Record<string, unknown>;

  const org = reqString(b.org);
  const title = reqString(b.title);
  if (!org) return { ok: false, error: "প্রতিষ্ঠানের নাম আবশ্যক।" };
  if (!title) return { ok: false, error: "পদের নাম / শিরোনাম আবশ্যক।" };

  const category = reqString(b.category);
  if (!category || !DB_CATEGORIES.includes(category as never)) {
    return { ok: false, error: "সঠিক ক্যাটাগরি বেছে নিন।" };
  }

  const published = reqString(b.published_date);
  const deadline = reqString(b.deadline);
  if (!published || !DATE_RE.test(published)) {
    return { ok: false, error: "প্রকাশের তারিখ ঠিকমতো দিন (YYYY-MM-DD)।" };
  }
  if (!deadline || !DATE_RE.test(deadline)) {
    return { ok: false, error: "শেষ তারিখ ঠিকমতো দিন (YYYY-MM-DD)।" };
  }

  let postsCount: number | null = null;
  if (b.posts_count !== null && b.posts_count !== undefined && b.posts_count !== "") {
    const n = Number(b.posts_count);
    if (!Number.isInteger(n) || n < 0) {
      return { ok: false, error: "পদসংখ্যা একটি সঠিক সংখ্যা হতে হবে।" };
    }
    postsCount = n;
  }

  const statusRaw = reqString(b.status) ?? "active";
  if (!VALID_STATUSES.includes(statusRaw as CircularStatus)) {
    return { ok: false, error: "সঠিক স্ট্যাটাস বেছে নিন।" };
  }

  return {
    ok: true,
    value: {
      org,
      title,
      category,
      posts_count: postsCount,
      salary: optString(b.salary),
      education: optString(b.education),
      location: optString(b.location),
      published_date: published,
      deadline,
      source_url: optString(b.source_url),
      apply_url: optString(b.apply_url),
      image_url: optString(b.image_url),
      status: statusRaw as CircularStatus,
      is_sample: b.is_sample === true,
    },
  };
}

function requireDb(): SupabaseClient {
  const svc = getServiceSupabase();
  if (!svc) {
    throw new Error(
      "Database (Supabase) এখনো সংযুক্ত নয় — এডিট করতে SUPABASE_SERVICE_ROLE_KEY সেট করুন।"
    );
  }
  return svc;
}

export async function adminCreateCircular(
  input: CircularInput
): Promise<Circular> {
  const svc = requireDb();
  const { data, error } = await svc
    .from("circulars")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const normalized = normalizeCircular(data as Record<string, unknown>, 0);
  if (!normalized) throw new Error("তৈরি করা সার্কুলারটি পড়া যায়নি।");
  return normalized;
}

export async function adminUpdateCircular(
  id: string,
  input: CircularInput
): Promise<Circular> {
  const svc = requireDb();
  const { data, error } = await svc
    .from("circulars")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const normalized = normalizeCircular(data as Record<string, unknown>, 0);
  if (!normalized) throw new Error("আপডেট করা সার্কুলারটি পড়া যায়নি।");
  return normalized;
}

export async function adminDeleteCircular(id: string): Promise<void> {
  const svc = requireDb();
  const { error } = await svc.from("circulars").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
