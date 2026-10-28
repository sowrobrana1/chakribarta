import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SaveShareButtons from "@/components/SaveShareButtons";
import { getCircular } from "@/lib/data";
import {
  daysLeft,
  formatBnDate,
  isUrgent,
  toBn,
} from "@/lib/format";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getCircular(params.id);
  if (!job) return { title: "সার্কুলার পাওয়া যায়নি — ChakriBarta" };
  return {
    title: `${job.org} — ${job.title} | ChakriBarta`,
    description: `${job.org} এ ${job.title}। আবেদনের শেষ তারিখ: ${formatBnDate(job.deadline)}।`,
  };
}

function countdownText(deadline: string): string {
  const left = daysLeft(deadline);
  if (left < 0) return "আবেদনের সময় শেষ হয়ে গেছে";
  if (left === 0) return "আজই আবেদনের শেষ দিন!";
  return `আবেদনের আর মাত্র ${toBn(left)} দিন বাকি`;
}

export default async function JobDetailsPage({ params }: Props) {
  const job = await getCircular(params.id);
  if (!job) notFound();

  const applyHref = job.apply_url ?? job.source_url;
  const rows: Array<[string, string]> = [
    ["পদ সংখ্যা", job.posts_count != null ? `${toBn(job.posts_count)}টি` : "—"],
    ["বেতন স্কেল", job.salary ?? "—"],
    ["যোগ্যতা", job.education ?? "—"],
    ["কর্মস্থল", job.location ?? "—"],
    ["প্রকাশের তারিখ", formatBnDate(job.published_date)],
    ["আবেদনের শেষ তারিখ", formatBnDate(job.deadline)],
  ];

  return (
    <>
      <header className="app-header">
        <Link href="/" className="back-link" aria-label="ফিরে যান">
          ‹
        </Link>
        <span className="header-title">সার্কুলারের বিস্তারিত</span>
        <span style={{ width: 30 }} />
      </header>

      <main className="details">
        <h1 className="details-org">{job.org}</h1>
        <p className="details-title">{job.title}</p>

        <div
          className={
            isUrgent(job.deadline)
              ? "countdown-banner urgent"
              : "countdown-banner"
          }
        >
          {countdownText(job.deadline)}
        </div>

        <dl className="info-list">
          {rows.map(([label, value]) => (
            <div className="info-row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="circular-image">
          {job.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.image_url} alt={`${job.org} সার্কুলারের ছবি`} />
          ) : (
            <span>সার্কুলারের ছবি / PDF (ট্যাপ করে zoom করে দেখুন)</span>
          )}
        </div>

        {applyHref ? (
          <a
            className="btn-apply"
            href={applyHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            আবেদন করুন
          </a>
        ) : (
          <span className="btn-apply disabled">আবেদনের লিংক শীঘ্রই আসছে</span>
        )}

        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            borderRadius: 10,
            background: "#f1f8f4",
            border: "1px solid #c8e6c9",
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          {job.source_url && job.source_url !== applyHref ? (
            <p style={{ margin: "0 0 8px" }}>
              মূল বিজ্ঞপ্তি (অফিসিয়াল উৎস):{" "}
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ wordBreak: "break-all" }}
              >
                মূল বিজ্ঞপ্তি দেখুন
              </a>
            </p>
          ) : null}
          <p style={{ margin: 0 }}>
            দাবিত্যাগ: ChakriBarta কোনো সরকারি সংস্থা নয় এবং সরকারের
            প্রতিনিধিত্ব করে না। এই তথ্য সংশ্লিষ্ট দপ্তরের বিজ্ঞপ্তি থেকে
            সংগৃহীত — আবেদনের আগে মূল বিজ্ঞপ্তিটি যাচাই করে নিন।
          </p>
        </div>

        <SaveShareButtons jobId={job.id} title={`${job.org} — ${job.title}`} />
      </main>
    </>
  );
}
