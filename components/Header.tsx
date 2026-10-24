import Link from "next/link";

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

function BellIcon() {
  return (
    <span className="bell-wrap">
      <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
        <path
          d="M12 3a5 5 0 0 0-5 5v3.6c0 .5-.2 1-.5 1.4L5 14.6c-.4.6.1 1.4.9 1.4h12.2c.8 0 1.3-.8.9-1.4l-1.5-1.6c-.3-.4-.5-.9-.5-1.4V8a5 5 0 0 0-5-5zm-2.2 14a2.3 2.3 0 0 0 4.4 0h-4.4z"
          fill="#ffffff"
        />
      </svg>
      <span className="bell-dot" />
    </span>
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
      <button type="button" className="bell-btn" aria-label="নোটিফিকেশন">
        <BellIcon />
      </button>
    </header>
  );
}
