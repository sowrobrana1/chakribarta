import Link from "next/link";
import type { Circular } from "@/lib/types";
import { deadlineBadgeText, isUrgent, toBn } from "@/lib/format";

export default function JobCard({ job }: { job: Circular }) {
  const metaParts: string[] = [];
  if (job.posts_count != null) metaParts.push(`পদ: ${toBn(job.posts_count)}টি`);
  if (job.education) metaParts.push(job.education);
  if (job.location) metaParts.push(job.location);

  return (
    <Link href={`/job/${job.id}`} className="job-card">
      <div className="job-card-top">
        <span className="tag">{job.category}</span>
        <span
          className={
            isUrgent(job.deadline) ? "deadline-badge urgent" : "deadline-badge"
          }
        >
          {deadlineBadgeText(job.deadline)}
        </span>
      </div>
      <h3 className="job-org">{job.org}</h3>
      <p className="job-title">{job.title}</p>
      {metaParts.length > 0 && (
        <p className="job-meta">{metaParts.join("  •  ")}</p>
      )}
      {job.is_sample && <span className="sample-flag">নমুনা</span>}
    </Link>
  );
}
