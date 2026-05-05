import Link from "next/link";

export default function CaseNotFound(): React.ReactElement {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-20"
      data-testid="case-not-found"
    >
      <h1 className="font-mono text-4xl font-bold text-text-muted">404</h1>
      <p className="text-text-secondary">Case not found</p>
      <Link
        href="/cases"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-surface-base hover:bg-primary-hover"
      >
        Back to Cases
      </Link>
    </div>
  );
}
