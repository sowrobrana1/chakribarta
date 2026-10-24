import Link from "next/link";
import type { Metadata } from "next";
import AgeCalculator from "@/components/AgeCalculator";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "বয়স ক্যালকুলেটর — ChakriBarta",
  description:
    "জন্ম তারিখ থেকে সঠিক বয়স (বছর/মাস/দিন) হিসাব করুন এবং সরকারি চাকরির সাধারণ বয়সসীমায় পড়েন কিনা যাচাই করুন।",
};

export default function AgePage() {
  return (
    <>
      <header className="app-header">
        <Link href="/" className="back-link" aria-label="ফিরে যান">
          ‹
        </Link>
        <span className="header-title">বয়স ক্যালকুলেটর</span>
        <span style={{ width: 30 }} />
      </header>

      <main className="admin-main">
        <AgeCalculator />
      </main>

      <BottomNav active="টুলস" />
    </>
  );
}
