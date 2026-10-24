"use client";

import { useMemo, useState } from "react";
import { formatBnDate, toBn } from "@/lib/format";

interface AgeParts {
  years: number;
  months: number;
  days: number;
  /** Total whole months — handy for limit checks. */
  totalMonths: number;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Exact age of `dobISO` on `refISO` (years/months/days), or null if invalid. */
function computeAge(dobISO: string, refISO: string): AgeParts | null {
  const dob = new Date(`${dobISO}T00:00:00`);
  const ref = new Date(`${refISO}T00:00:00`);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(ref.getTime())) return null;
  if (ref.getTime() < dob.getTime()) return null;

  let years = ref.getFullYear() - dob.getFullYear();
  let months = ref.getMonth() - dob.getMonth();
  let days = ref.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    // Days in the month just before the reference month.
    const prevMonthDays = new Date(
      ref.getFullYear(),
      ref.getMonth(),
      0
    ).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days, totalMonths: years * 12 + months };
}

interface LimitRule {
  label: string;
  minYears: number;
  maxYears: number;
  note?: string;
}

/**
 * Commonly seen age limits in Bangladeshi govt job circulars. These are
 * general information only — every circular sets its own rule (shown in
 * the UI disclaimer as well).
 */
const COMMON_LIMITS: LimitRule[] = [
  { label: "সাধারণ প্রার্থী (বেশিরভাগ সরকারি চাকরি)", minYears: 18, maxYears: 30 },
  {
    label: "মুক্তিযোদ্ধা / শহীদ মুক্তিযোদ্ধার সন্তান",
    minYears: 18,
    maxYears: 32,
  },
  {
    label: "পুলিশ কনস্টেবল (ট্রেইনি রিক্রুট)",
    minYears: 18,
    maxYears: 20,
    note: "সাম্প্রতিক বিজ্ঞপ্তি অনুযায়ী",
  },
];

function limitStatus(
  age: AgeParts,
  rule: LimitRule
): "ok" | "young" | "over" {
  if (age.totalMonths < rule.minYears * 12) return "young";
  // Over the max once the candidate's age passes maxYears completely,
  // i.e. from the (maxYears + 1)-th birthday.
  if (age.years > rule.maxYears) return "over";
  return "ok";
}

export default function AgeCalculator() {
  const [dob, setDob] = useState("");
  const [ref, setRef] = useState(todayISO());

  const age = useMemo(
    () => (dob && ref ? computeAge(dob, ref) : null),
    [dob, ref]
  );
  const invalid = Boolean(dob && ref && !age);

  return (
    <>
      <section className="admin-card">
        <h2 className="admin-card-title">আপনার বয়স হিসাব করুন</h2>
        <p className="admin-muted">
          জন্ম তারিখ দিন — কোন তারিখে (সাধারণত সার্কুলারের আবেদনের শেষ
          তারিখ) আপনার বয়স কত হবে, তা নিচে দেখা যাবে।
        </p>
        <div className="admin-form">
          <div className="form-field">
            <label htmlFor="age-dob">জন্ম তারিখ</label>
            <input
              id="age-dob"
              type="date"
              value={dob}
              max={todayISO()}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="age-ref">
              হিসাবের তারিখ (সার্কুলারের শেষ তারিখ / আজ)
            </label>
            <input
              id="age-ref"
              type="date"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </div>
        </div>

        {invalid && (
          <p className="admin-error" style={{ marginTop: 12 }}>
            তারিখ ঠিকমতো দিন — হিসাবের তারিখ জন্ম তারিখের আগের হতে পারবে না।
          </p>
        )}

        {age && (
          <div className="age-result">
            <div className="age-big">
              {toBn(age.years)} বছর {toBn(age.months)} মাস {toBn(age.days)} দিন
            </div>
            <p className="admin-muted" style={{ marginBottom: 0 }}>
              {formatBnDate(ref)} তারিখে আপনার বয়স হবে ঠিক এতটুকু।
            </p>
          </div>
        )}
      </section>

      {age && (
        <section className="admin-card">
          <h2 className="admin-card-title">সাধারণ বয়সসীমায় পড়েন কিনা</h2>
          <div className="admin-list">
            {COMMON_LIMITS.map((rule) => {
              const status = limitStatus(age, rule);
              return (
                <div key={rule.label} className="age-limit-row">
                  <div>
                    <div className="age-limit-label">{rule.label}</div>
                    <div className="admin-muted" style={{ marginBottom: 0 }}>
                      বয়সসীমা: {toBn(rule.minYears)}–{toBn(rule.maxYears)} বছর
                      {rule.note ? ` (${rule.note})` : ""}
                    </div>
                  </div>
                  <span
                    className={
                      status === "ok"
                        ? "tag"
                        : status === "young"
                          ? "tag status-draft"
                          : "tag status-expired"
                    }
                  >
                    {status === "ok"
                      ? "✓ পড়েন"
                      : status === "young"
                        ? "এখনো বয়স হয়নি"
                        : "সীমা পার হয়ে গেছে"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="notice" style={{ marginTop: 14 }}>
            ⚠️ এটি সাধারণ তথ্য মাত্র। প্রতিটি সার্কুলারের নিজস্ব
            বিজ্ঞপ্তিতে বয়সসীমা ও হিসাবের তারিখ আলাদা করে দেওয়া থাকে —
            আবেদনের আগে সেই বিজ্ঞপ্তির শর্তই চূড়ান্ত হিসেবে মিলিয়ে নিন।
          </p>
        </section>
      )}
    </>
  );
}
