"use client";

import { useEffect, useState } from "react";
import JobCard from "./JobCard";
import type { Circular } from "@/lib/types";

const STORAGE_KEY = "cb_saved_jobs";

function readSavedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export default function SavedList({ jobs }: { jobs: Circular[] }) {
  const [savedJobs, setSavedJobs] = useState<Circular[] | null>(null);

  useEffect(() => {
    const ids = readSavedIds();
    const byId = new Map(jobs.map((j) => [j.id, j]));
    setSavedJobs(
      ids
        .map((id) => byId.get(id))
        .filter((j): j is Circular => Boolean(j))
    );
  }, [jobs]);

  return (
    <main className="feed">
      {savedJobs === null ? null : savedJobs.length === 0 ? (
        <div className="empty-state">
          <h2>এখনো কিছু সেভ করেননি</h2>
          <p>
            পছন্দের সার্কুলার খুলে &ldquo;সেভ করুন&rdquo; বোতামে ট্যাপ করলেই
            সেটি এখানে পেয়ে যাবেন।
          </p>
        </div>
      ) : (
        savedJobs.map((job) => <JobCard key={job.id} job={job} />)
      )}
    </main>
  );
}
