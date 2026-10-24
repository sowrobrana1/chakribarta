import { promises as fs } from "fs";
import path from "path";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { Circular, CircularStatus } from "./types";

/**
 * Data loader for circulars.
 *
 * Primary source: Supabase `circulars` table (when
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set).
 * Fallback: local JSON file at <project>/data/circulars.json
 * (an array of circular records; a missing/invalid file yields []).
 *
 * Visibility rule (same for both sources): status is published
 * ("published" or the schema's "active") AND (deadline >= today OR
 * the record is a result — category "ফলাফল"), newest first.
 */

export interface CircularQuery {
  category?: string;
  query?: string;
  /** Also return items whose deadline has passed (used by the saved page). */
  includeExpired?: boolean;
}

const RESULT_CATEGORY = "ফলাফল";
const PUBLISHED_STATUSES: ReadonlyArray<string> = ["published", "active"];

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type RawCircular = Record<string, unknown>;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** Convert a raw record (Supabase row or JSON entry) to a Circular. */
function normalize(raw: RawCircular, index: number): Circular | null {
  const org = asString(raw.org);
  const title = asString(raw.title);
  const category = asString(raw.category);
  if (!org || !title || !category) return null;

  const publishedDate = asString(raw.published_date) ?? todayISO();
  const deadline = asString(raw.deadline) ?? publishedDate;

  const rawId = raw.id;
  const id =
    typeof rawId === "string" || typeof rawId === "number"
      ? String(rawId)
      : `local-${index}`;

  const rawStatus = asString(raw.status);
  const status: CircularStatus =
    rawStatus === "draft" || rawStatus === "expired" ? rawStatus : "active";

  return {
    id,
    org,
    title,
    category,
    posts_count: typeof raw.posts_count === "number" ? raw.posts_count : null,
    salary: asString(raw.salary),
    education: asString(raw.education),
    location: asString(raw.location),
    published_date: publishedDate,
    deadline,
    source_url: asString(raw.source_url),
    apply_url: asString(raw.apply_url),
    image_url: asString(raw.image_url),
    status,
    is_sample: raw.is_sample === true,
    created_at: asString(raw.created_at) ?? publishedDate,
  };
}

function normalizeAll(rows: RawCircular[]): Circular[] {
  const out: Circular[] = [];
  rows.forEach((row, i) => {
    const c = normalize(row, i);
    if (c) out.push(c);
  });
  return out;
}

function isVisible(c: Circular, includeExpired: boolean): boolean {
  if (!PUBLISHED_STATUSES.includes(c.status)) return false;
  if (includeExpired) return true;
  if (c.category === RESULT_CATEGORY) return true;
  return c.deadline >= todayISO();
}

function applyQuery(list: Circular[], query: CircularQuery): Circular[] {
  let out = list.filter((c) => isVisible(c, query.includeExpired ?? false));

  if (query.category && query.category !== "সব") {
    out = out.filter((c) => c.category === query.category);
  }
  if (query.query && query.query.trim().length > 0) {
    const term = query.query.trim().toLowerCase();
    out = out.filter((c) =>
      `${c.org} ${c.title} ${c.category}`.toLowerCase().includes(term)
    );
  }

  return out.sort((a, b) => {
    if (a.published_date !== b.published_date) {
      return a.published_date < b.published_date ? 1 : -1;
    }
    return a.created_at < b.created_at ? 1 : -1;
  });
}

async function loadFromSupabase(): Promise<Circular[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("circulars")
      .select("*")
      .in("status", [...PUBLISHED_STATUSES])
      .order("published_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("loadFromSupabase error:", error.message);
      return null;
    }
    return normalizeAll((data ?? []) as RawCircular[]);
  } catch (err) {
    console.error("loadFromSupabase failed:", err);
    return null;
  }
}

async function loadFromLocalFile(): Promise<Circular[]> {
  try {
    const file = path.join(process.cwd(), "data", "circulars.json");
    const text = await fs.readFile(file, "utf8");
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return normalizeAll(parsed as RawCircular[]);
  } catch {
    return [];
  }
}

async function loadAll(): Promise<Circular[]> {
  if (isSupabaseConfigured) {
    const rows = await loadFromSupabase();
    if (rows) return rows;
  }
  return loadFromLocalFile();
}

/** All visible circulars, newest first (optionally filtered). */
export async function getCirculars(
  query: CircularQuery = {}
): Promise<Circular[]> {
  const all = await loadAll();
  return applyQuery(all, query);
}

/** Raw-record normalizer, shared with the admin layer (lib/admin.ts). */
export const normalizeCircular = normalize;

/**
 * Every record in the local fallback file, with NO visibility
 * filtering (drafts/expired included). Used by the admin panel's
 * read-only mode when Supabase is not connected.
 */
export async function getLocalCircularsAll(): Promise<Circular[]> {
  return loadFromLocalFile();
}

/**
 * One circular by id. Ignores the deadline rule so shared / saved
 * links keep working after a deadline passes; drafts/expired rows
 * are never returned.
 */
export async function getCircular(id: string): Promise<Circular | null> {
  const all = await loadAll();
  return (
    all.find(
      (c) => c.id === id && PUBLISHED_STATUSES.includes(c.status)
    ) ?? null
  );
}
