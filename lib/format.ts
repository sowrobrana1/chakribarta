const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

/** Convert Latin digits in a string/number to Bengali digits. */
export function toBn(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Format an ISO date (yyyy-mm-dd) as e.g. "২৪ অক্টোবর, ২০২৬". */
export function formatBnDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return `${toBn(d.getDate())} ${BN_MONTHS[d.getMonth()]}, ${toBn(d.getFullYear())}`;
}

/** Whole days left until the deadline (0 = today, negative = passed). */
export function daysLeft(deadlineISO: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dl = new Date(`${deadlineISO}T00:00:00`);
  return Math.round((dl.getTime() - today.getTime()) / 86_400_000);
}

/** Badge text for the home feed, e.g. "আর ৫ দিন বাকি". */
export function deadlineBadgeText(deadlineISO: string): string {
  const left = daysLeft(deadlineISO);
  if (left < 0) return "সময় শেষ";
  if (left === 0) return "আজই শেষ দিন";
  return `আর ${toBn(left)} দিন বাকি`;
}

export function isUrgent(deadlineISO: string): boolean {
  return daysLeft(deadlineISO) <= 5;
}
