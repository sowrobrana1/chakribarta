"use client";

import { useMemo, useState } from "react";
import JobCard from "./JobCard";
import { CATEGORIES, type Circular } from "@/lib/types";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#68746e" strokeWidth="2.4" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="#68746e" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  jobs: Circular[];
  initialCategory?: string;
}

export default function HomeFeed({ jobs, initialCategory = "সব" }: Props) {
  const [category, setCategory] = useState(
    (CATEGORIES as readonly string[]).includes(initialCategory)
      ? initialCategory
      : "সব"
  );
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (category !== "সব" && job.category !== category) return false;
      if (!term) return true;
      return `${job.org} ${job.title} ${job.category}`
        .toLowerCase()
        .includes(term);
    });
  }, [jobs, category, query]);

  const isFiltering = query.trim().length > 0 || category !== "সব";

  return (
    <>
      <div className="search-wrap">
        <div className="search-bar">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="চাকরি খুঁজুন…"
            aria-label="চাকরি খুঁজুন"
          />
        </div>
      </div>

      <nav className="chips" aria-label="ক্যাটাগরি">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cat === category ? "chip chip-active" : "chip"}
            aria-pressed={cat === category}
          >
            {cat}
          </button>
        ))}
      </nav>

      <main className="feed">
        {filtered.length === 0 ? (
          <div className="empty-state">
            {isFiltering ? (
              <>
                <h2>কোনো ফলাফল পাওয়া যায়নি</h2>
                <p>অন্য নাম বা ক্যাটাগরি দিয়ে আবার খুঁজে দেখুন।</p>
              </>
            ) : (
              <>
                <h2>এখনো কোনো সার্কুলার পাওয়া যায়নি</h2>
                <p>নতুন সার্কুলার যোগ হলেই এখানে দেখা যাবে। একটু পরে আবার দেখুন।</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </main>
    </>
  );
}
