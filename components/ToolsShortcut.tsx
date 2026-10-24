import Link from "next/link";

/** Shortcut cards on the home page for the job-seeker tools. */
export default function ToolsShortcut() {
  return (
    <div className="tools-row">
      <Link href="/age" className="tools-chip">
        <span aria-hidden="true">🎂</span> বয়স ক্যালকুলেটর
      </Link>
      <Link href="/cv" className="tools-chip">
        <span aria-hidden="true">📄</span> AI CV তৈরি করুন
      </Link>
    </div>
  );
}
