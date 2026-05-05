import type { AuditLogEntry } from "@/lib/types";

interface AuditLogPanelProps {
  entries: AuditLogEntry[];
}

export function AuditLogPanel({ entries }: AuditLogPanelProps): React.ReactElement {
  return (
    <div
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="audit-log-panel"
    >
      <h2 className="font-mono text-base font-bold text-text-primary">
        Audit Log
      </h2>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No audit entries.</p>
      ) : (
        <div className="mt-4 space-y-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 border-b border-[#1E293B] px-2 py-2.5 text-sm last:border-b-0"
              data-testid="audit-log-entry"
            >
              <span className="shrink-0 font-mono text-xs text-text-muted">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-text-secondary">{entry.actor}</span>
                <span className="mx-1.5 text-text-muted">·</span>
                <span className="font-medium text-text-primary">{entry.action}</span>
                {entry.details && (
                  <p className="mt-0.5 text-xs text-text-muted">{entry.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
