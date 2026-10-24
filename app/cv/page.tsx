import Link from "next/link";
import type { Metadata } from "next";
import CvMaker from "@/components/CvMaker";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "AI CV Maker — ChakriBarta",
  description:
    "সহজ ফর্ম পূরণ করে পেশাদার CV তৈরি করুন — AI দিয়ে সাজানো Career Objective, প্রিন্ট/PDF সুবিধাসহ।",
};

export default function CvPage() {
  return (
    <>
      <header className="app-header">
        <Link href="/" className="back-link" aria-label="ফিরে যান">
          ‹
        </Link>
        <span className="header-title">AI CV Maker</span>
        <span style={{ width: 30 }} />
      </header>

      <main className="admin-main">
        <CvMaker />
      </main>

      <BottomNav active="টুলস" />
    </>
  );
}
