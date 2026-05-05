import type { CaseStatus } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { RiskScoreBadge } from "@/components/ui/risk-score-badge";

interface CaseHeaderProps {
  caseNumber: string;
  customerName: string;
  status: CaseStatus;
  riskScore: number;
  assignedAnalyst: string;
}

export function CaseHeader({ caseNumber, customerName, status, riskScore, assignedAnalyst }: CaseHeaderProps): React.ReactElement {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-card-border bg-card p-5"
      data-testid="case-header"
    >
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold text-text-primary">
            {caseNumber}
          </h1>
          <p className="text-sm text-text-secondary" data-testid="case-header-customer-name">
            {customerName}
          </p>
        </div>
        <StatusBadge status={status} />
        <RiskScoreBadge score={riskScore} />
      </div>
      <p className="text-sm text-text-secondary">
        Analyst: <span className="text-text-primary">{assignedAnalyst}</span>
      </p>
    </div>
  );
}
