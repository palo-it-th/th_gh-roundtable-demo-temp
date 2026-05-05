export default function CasesLoading(): React.ReactElement {
  return (
    <div className="space-y-6" data-testid="cases-loading">
      <div className="h-8 w-32 animate-pulse rounded bg-card" />
      <div className="overflow-hidden rounded-md border border-card-border bg-card">
        <div className="border-b border-card-border px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-surface-editor" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-[#1E293B] px-4 py-3">
            <div className="h-4 w-full animate-pulse rounded bg-surface-editor" />
          </div>
        ))}
      </div>
    </div>
  );
}
