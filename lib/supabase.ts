import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Circular } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string);
  }
  return client;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface CircularFilters {
  category?: string;
  query?: string;
}

/**
 * Fetch active, non-expired circulars, newest first.
 * Returns [] when Supabase is not configured or the query fails,
 * so the UI can show a graceful empty state.
 */
export async function fetchCirculars(
  filters: CircularFilters = {}
): Promise<Circular[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    let q = supabase
      .from("circulars")
      .select("*")
      .eq("status", "active")
      .gte("deadline", todayISO())
      .order("published_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.category && filters.category !== "সব") {
      q = q.eq("category", filters.category);
    }
    if (filters.query && filters.query.trim().length > 0) {
      const term = filters.query.trim();
      q = q.or(`org.ilike.%${term}%,title.ilike.%${term}%`);
    }

    const { data, error } = await q.limit(100);
    if (error) {
      console.error("fetchCirculars error:", error.message);
      return [];
    }
    return (data ?? []) as Circular[];
  } catch (err) {
    console.error("fetchCirculars failed:", err);
    return [];
  }
}

export async function fetchCircularById(
  id: string
): Promise<Circular | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("circulars")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as Circular;
  } catch {
    return null;
  }
}
