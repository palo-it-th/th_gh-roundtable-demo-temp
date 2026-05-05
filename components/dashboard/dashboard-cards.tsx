interface SummaryCardProps {
  title: string;
  value: number | string;
  accent?: "primary" | "secondary" | "tertiary" | "error";
}

const ACCENT_STYLES = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  error: "text-error",
};

function SummaryCard({ title, value, accent = "primary" }: SummaryCardProps): React.ReactElement {
  return (
    <div
      className="rounded-md border border-card-border bg-card p-5 shadow-md transition-colors hover:border-card-border-hover"
      data-testid="summary-card"
    >
      <p className="text-sm text-text-secondary">{title}</p>
      <p className={`mt-2 font-mono text-3xl font-bold ${ACCENT_STYLES[accent]}`}>
        {value}
      </p>
    </div>
  );
}

interface DashboardCardsProps {
  totalOpenCases: number;
  highRiskCases: number;
  pendingReviewerApproval: number;
  pendingStrFiling: number;
  averageCaseAgeDays: number;
  oldestCaseAgeDays: number;
}

export function DashboardCards({
  totalOpenCases,
  highRiskCases,
  pendingReviewerApproval,
  pendingStrFiling,
  averageCaseAgeDays,
  oldestCaseAgeDays,
}: DashboardCardsProps): React.ReactElement {
  return (
    <div data-testid="dashboard-cards">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Open Cases" value={totalOpenCases} accent="secondary" />
        <SummaryCard title="High-Risk Cases" value={highRiskCases} accent="error" />
        <SummaryCard title="Pending Approval" value={pendingReviewerApproval} accent="tertiary" />
        <SummaryCard title="Pending Filing" value={pendingStrFiling} accent="primary" />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SummaryCard
          title="Average Case Age"
          value={`${averageCaseAgeDays}d`}
          accent="secondary"
        />
        <SummaryCard
          title="Oldest Case"
          value={`${oldestCaseAgeDays}d`}
          accent="tertiary"
        />
      </div>
    </div>
  );
}
