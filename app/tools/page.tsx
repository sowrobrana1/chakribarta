import Link from "next/link";
import type { Metadata } from "next";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "টুলস — ChakriBarta",
  description:
    "চাকরিপ্রার্থীদের জন্য দরকারি টুলস: বয়স ক্যালকুলেটর ও AI CV Maker।",
};

const TOOLS = [
  {
    href: "/age",
    icon: "🎂",
    title: "বয়স ক্যালকুলেটর",
    text: "জন্ম তারিখ থেকে সঠিক বয়স বের করুন এবং সরকারি চাকরির বয়সসীমায় পড়েন কিনা দেখুন।",
  },
  {
    href: "/cv",
    icon: "📄",
    title: "AI CV Maker",
    text: "সহজ ফর্ম পূরণ করে পেশাদার CV তৈরি করুন — প্রিন্ট বা PDF সেভ করা যায়।",
  },
];

export default function ToolsPage() {
  return (
    <>
      <header className="app-header">
        <Link href="/" className="back-link" aria-label="ফিরে যান">
          ‹
        </Link>
        <span className="header-title">টুলস</span>
        <span style={{ width: 30 }} />
      </header>

      <main className="feed">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="job-card tool-card">
            <span className="tool-icon" aria-hidden="true">
              {tool.icon}
            </span>
            <span>
              <span className="job-org" style={{ fontSize: 21 }}>
                {tool.title}
              </span>
              <span className="job-meta" style={{ display: "block" }}>
                {tool.text}
              </span>
            </span>
          </Link>
        ))}
      </main>

      <BottomNav active="টুলস" />
    </>
  );
}
