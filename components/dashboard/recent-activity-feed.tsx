import Link from "next/link";
import type { ActivityEntry } from "@/lib/types";

interface RecentActivityFeedProps {
  activities: ActivityEntry[];
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps): React.ReactElement {
  return (
    <div
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="recent-activity-feed"
    >
      <h2 className="font-mono text-lg font-bold text-text-primary">
        Recent Activity
      </h2>
      {activities.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No recent activity.</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {activities.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-3 border-b border-[#1E293B] px-2 py-2.5 text-sm last:border-b-0"
              data-testid={`activity-entry-${a.id}`}
            >
              <span className="shrink-0 font-mono text-xs text-text-muted">
                {new Date(a.timestamp).toLocaleString()}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-text-secondary">{a.actor}</span>
                <span className="mx-1.5 text-text-muted">·</span>
                <span className="font-medium text-text-primary">{a.action}</span>
                <span className="mx-1.5 text-text-muted">on</span>
                <Link
                  href={`/cases/${a.caseId}`}
                  className="font-mono text-secondary hover:underline"
                >
                  {a.caseNumber}
                </Link>
                {a.details && (
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {a.details}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
