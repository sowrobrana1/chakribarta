#!/usr/bin/env node
/**
 * ChakriBarta — ingest monitor (skeleton).
 *
 * Fetches a small set of public job-listing pages, extracts candidate
 * circulars (org/title/deadline/apply link where parseable), dedupes
 * them against data/circulars.json, and writes the NEW candidates to
 * data/candidates.json with status "needs_verification".
 *
 * HARD RULE: this script NEVER writes to data/circulars.json and never
 * auto-publishes. Every candidate must be verified against the
 * OFFICIAL source (the employer's / Teletalk notice) by a human or the
 * admin flow before it can go live.
 *
 * Sources:
 *  - bdjobs.com homepage — embeds a JSON payload of recent jobs
 *    (Jobid / jobTitle / companyName / deadlineDB / publishDate …),
 *    which we parse directly. Detail URL: bdjobs.com/jobdetails.asp?id=
 *  - chakri.com — generic anchor extraction (best effort skeleton).
 *
 * Run: npm run collect
 * Exit code is always 0 — fetch failures just yield fewer candidates.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CIRCULARS_FILE = path.join(ROOT, "data", "circulars.json");
const CANDIDATES_FILE = path.join(ROOT, "data", "candidates.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 25_000;
const MAX_CANDIDATES = 60;

const SOURCES = [
  { name: "bdjobs", url: "https://jobs.bdjobs.com/", extract: extractBdjobs },
  { name: "chakri.com", url: "https://chakri.com/", extract: extractGeneric },
];

/* ---------------------------- helpers ---------------------------- */

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\/+$/, "");
}

const MONTHS = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/** Try to find a deadline in a chunk of listing text → ISO date or null. */
function parseDeadline(text) {
  // "30 Oct 2026" / "30 October 2026"
  let m = text.match(
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i
  );
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mon) return `${m[3]}-${mon}-${m[1].padStart(2, "0")}`;
  }
  // "30/10/2026" or "30-10-2026" or "30.10.2026" (dd/mm/yyyy)
  m = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    if (Number(mm) >= 1 && Number(mm) <= 12 && Number(dd) >= 1 && Number(dd) <= 31) {
      return `${m[3]}-${mm}-${dd}`;
    }
  }
  // ISO already
  m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return m[0];
  return null;
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------- extractors ---------------------------- */

/** Unescape a JSON string body captured by regex. */
function jsonString(raw) {
  if (raw === undefined) return null;
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
}

function jsonField(chunk, key) {
  const m = chunk.match(new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`));
  return m ? jsonString(m[1]) : null;
}

/**
 * bdjobs: the homepage embeds job objects like
 * {"Jobid":"1548155","jobTitle":"…","companyName":"…",
 *  "deadlineDB":"2026-11-23T00:00:00Z","publishDate":"2026-10-23T…",
 *  "location":"…","Vacancies":2, …}
 */
function extractBdjobs(html) {
  const out = [];
  const marker = /"Jobid":"(\d+)"/g;
  let match;
  while ((match = marker.exec(html)) !== null) {
    const id = match[1];
    const chunk = html.slice(match.index, match.index + 3500);

    const title = jsonField(chunk, "jobTitle");
    if (!title || title.length < 5) continue;

    const deadlineDB = chunk.match(/"deadlineDB":"(\d{4}-\d{2}-\d{2})/);
    const publishDB = chunk.match(/"publishDate":"(\d{4}-\d{2}-\d{2})/);
    const vac = chunk.match(/"Vacancies":(?:"(\d+)"|(\d+))/);

    out.push({
      org: jsonField(chunk, "companyName"),
      title: title.trim(),
      deadline: deadlineDB ? deadlineDB[1] : null,
      published_date: publishDB ? publishDB[1] : null,
      location: jsonField(chunk, "location"),
      posts_count: vac ? Number(vac[1] ?? vac[2]) : null,
      apply_url: `https://bdjobs.com/jobdetails.asp?id=${id}`,
    });
  }
  return out;
}

/** Generic fallback: job-looking anchors + nearby deadline text. */
function extractGeneric(html, source) {
  const out = [];
  const anchorRe = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRe.exec(html)) !== null) {
    const href = match[1].trim();
    if (!/job/i.test(href)) continue;
    if (/^(javascript:|#|mailto:)/i.test(href)) continue;

    const title = stripTags(match[2]);
    if (title.length < 8 || title.length > 200) continue;

    let applyUrl;
    try {
      applyUrl = new URL(href, source.url).toString();
    } catch {
      continue;
    }

    const windowText = stripTags(html.slice(match.index, match.index + 1800));
    out.push({
      org: null,
      title,
      deadline: parseDeadline(windowText),
      published_date: null,
      location: null,
      posts_count: null,
      apply_url: applyUrl,
    });
  }
  return out;
}

async function readJsonArray(file) {
  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ---------------------------- main ---------------------------- */

async function main() {
  const extractedAt = new Date().toISOString();
  const existing = await readJsonArray(CIRCULARS_FILE);
  const seenUrls = new Set(existing.map((c) => normalizeKey(c.apply_url)));
  const seenTitles = new Set(existing.map((c) => normalizeKey(c.title)));

  const candidates = [];
  const seenCandidateUrls = new Set();

  for (const source of SOURCES) {
    let found = [];
    try {
      const html = await fetchPage(source.url);
      found = source.extract(html, source);
      console.log(`[collect] ${source.name}: ${found.length} job(s) extracted`);
    } catch (err) {
      console.warn(
        `[collect] ${source.name}: fetch failed (${err.message}) — skipping`
      );
      continue;
    }

    for (const item of found) {
      const urlKey = normalizeKey(item.apply_url);
      const titleKey = normalizeKey(item.title);
      if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) continue;
      if (seenCandidateUrls.has(urlKey)) continue;
      seenCandidateUrls.add(urlKey);

      candidates.push({
        org: item.org ?? null, // verified/filled at official-source check
        title: item.title,
        category: null,
        posts_count: item.posts_count ?? null,
        salary: null,
        education: null,
        location: item.location ?? null,
        published_date: item.published_date ?? null,
        deadline: item.deadline ?? null,
        source_url: source.url,
        apply_url: item.apply_url,
        status: "needs_verification",
        source_site: source.name,
        extracted_at: extractedAt,
      });
      if (candidates.length >= MAX_CANDIDATES) break;
    }
    if (candidates.length >= MAX_CANDIDATES) break;
  }

  await fs.mkdir(path.dirname(CANDIDATES_FILE), { recursive: true });
  await fs.writeFile(
    CANDIDATES_FILE,
    JSON.stringify(candidates, null, 2) + "\n",
    "utf8"
  );
  console.log(
    `[collect] wrote ${candidates.length} new candidate(s) to data/candidates.json ` +
      `(status: needs_verification — nothing was published)`
  );
}

main()
  .catch((err) => {
    // Never crash the pipeline: write an empty candidates file + note.
    console.warn(`[collect] unexpected error: ${err.message}`);
    return fs
      .writeFile(CANDIDATES_FILE, "[]\n", "utf8")
      .catch(() => {});
  })
  .finally(() => process.exit(0));
