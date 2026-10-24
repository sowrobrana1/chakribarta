import Link from "next/link";
import PushBell from "./PushBell";

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        d="M9 7V6a3 3 0 0 1 3-3v0a3 3 0 0 1 3 3v1h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4zm2 0h2V6a1 1 0 0 0-1-1v0a1 1 0 0 0-1 1v1z"
        fill="#0a5c3e"
      />
      <rect x="3" y="11" width="18" height="2.4" fill="#0a5c3e" opacity="0.35" />
      <rect x="10.2" y="10.2" width="3.6" height="4" rx="0.8" fill="#e9b23c" />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        <span className="brand-mark">
          <BriefcaseIcon />
        </span>
        <span className="brand-name">ChakriBarta</span>
      </Link>
      {/* Push subscribe bell — hides itself until VAPID keys are set. */}
      <PushBell />
    </header>
  );
}
