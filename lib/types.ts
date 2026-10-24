export const CATEGORIES = [
  "সব",
  "সরকারি",
  "ব্যাংক",
  "NGO",
  "প্রাইভেট",
  "শিক্ষক",
  "প্রতিরক্ষা",
  "ফলাফল",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Categories that are stored in the DB (everything except "সব"). */
export const DB_CATEGORIES = CATEGORIES.filter((c) => c !== "সব");

export type CircularStatus = "active" | "expired" | "draft";

export interface Circular {
  id: string;
  org: string;
  title: string;
  category: string;
  posts_count: number | null;
  salary: string | null;
  education: string | null;
  location: string | null;
  published_date: string; // ISO date (yyyy-mm-dd)
  deadline: string; // ISO date (yyyy-mm-dd)
  source_url: string | null;
  apply_url: string | null;
  image_url: string | null;
  status: CircularStatus;
  is_sample: boolean;
  created_at: string;
}
