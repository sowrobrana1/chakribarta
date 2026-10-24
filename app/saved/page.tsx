import Link from "next/link";
import type { Metadata } from "next";
import SavedList from "@/components/SavedList";
import BottomNav from "@/components/BottomNav";
import { getCirculars } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "সেভ করা সার্কুলার — ChakriBarta",
  description: "আপনার সেভ করা চাকরির সার্কুলারগুলো।",
};

export default async function SavedPage() {
  // includeExpired: a saved circular should stay listed even after its
  // deadline passes, so the user can still find the link they saved.
  const jobs = await getCirculars({ includeExpired: true });

  return (
    <>
      <header className="app-header">
        <Link href="/" className="back-link" aria-label="ফিরে যান">
          ‹
        </Link>
        <span className="header-title">সেভ করা সার্কুলার</span>
        <span style={{ width: 30 }} />
      </header>

      <SavedList jobs={jobs} />

      <BottomNav active="সেভ করা" />
    </>
  );
}
