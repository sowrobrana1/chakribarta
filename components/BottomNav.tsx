import Link from "next/link";

const ITEMS = [
  { label: "হোম", href: "/" },
  { label: "ক্যাটাগরি", href: "/" },
  { label: "সেভ করা", href: "/saved" },
  { label: "টুলস", href: "/tools" },
  { label: "ফলাফল", href: "/?cat=ফলাফল" },
];

export default function BottomNav({ active = "হোম" }: { active?: string }) {
  return (
    <nav className="bottom-nav" aria-label="প্রধান মেনু">
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={
            item.label === active
              ? "bottom-nav-item active"
              : "bottom-nav-item"
          }
        >
          <span className="bottom-nav-dot" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
