export default function CaseDetailLoading(): React.ReactElement {
  return (
    <div className="space-y-6" data-testid="case-detail-loading">
      {/* Header skeleton */}
      <div className="rounded-md border border-card-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="h-8 w-40 animate-pulse rounded bg-surface-editor" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-surface-editor" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-surface-editor" />
        </div>
      </div>

      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-md border border-card-border bg-card p-5">
            <div className="h-5 w-32 animate-pulse rounded bg-surface-editor" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="h-4 w-full animate-pulse rounded bg-surface-editor" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Transaction skeleton */}
      <div className="rounded-md border border-card-border bg-card p-5">
        <div className="h-5 w-40 animate-pulse rounded bg-surface-editor" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded bg-surface-editor" />
          ))}
        </div>
      </div>
    </div>
  );
}
