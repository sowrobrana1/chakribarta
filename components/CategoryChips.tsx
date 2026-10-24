import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

interface Props {
  active: string;
  query?: string;
}

export default function CategoryChips({ active, query }: Props) {
  return (
    <nav className="chips" aria-label="ক্যাটাগরি">
      {CATEGORIES.map((cat) => {
        const params = new URLSearchParams();
        if (cat !== "সব") params.set("cat", cat);
        if (query) params.set("q", query);
        const qs = params.toString();
        const href = qs ? `/?${qs}` : "/";
        return (
          <Link
            key={cat}
            href={href}
            className={cat === active ? "chip chip-active" : "chip"}
          >
            {cat}
          </Link>
        );
      })}
    </nav>
  );
}
