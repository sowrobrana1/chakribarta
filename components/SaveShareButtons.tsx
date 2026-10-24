"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cb_saved_jobs";

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

interface Props {
  jobId: string;
  title: string;
}

export default function SaveShareButtons({ jobId, title }: Props) {
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    setSaved(readSaved().includes(jobId));
  }, [jobId]);

  function toggleSave() {
    const list = readSaved();
    const next = list.includes(jobId)
      ? list.filter((id) => id !== jobId)
      : [...list, jobId];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
    setSaved(next.includes(jobId));
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* user cancelled share */
    }
  }

  return (
    <div className="action-row">
      <button
        type="button"
        onClick={toggleSave}
        className={saved ? "btn-outline saved" : "btn-outline"}
      >
        {saved ? "✓ সেভ হয়েছে" : "সেভ করুন"}
      </button>
      <button type="button" onClick={share} className="btn-outline">
        {shared ? "লিংক কপি হয়েছে" : "শেয়ার করুন"}
      </button>
    </div>
  );
}
