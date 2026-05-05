import Link from "next/link";
import type { PriorityCase } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { RiskScoreBadge } from "@/components/ui/risk-score-badge";

interface PriorityCaseQueueProps {
  cases: PriorityCase[];
}

export function PriorityCaseQueue({ cases }: PriorityCaseQueueProps): React.ReactElement {
  return (
    <div
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="priority-case-queue"
    >
      <h2 className="font-mono text-lg font-bold text-text-primary">
        Priority Cases
      </h2>
      {cases.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No priority cases.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs text-text-muted">
                <th className="pb-2 pr-4">Case #</th>
                <th className="pb-2 pr-4">Customer</th>
                <th className="pb-2 pr-4">Risk Score</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Age (days)</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const ageDays = Math.floor(
                  (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <tr
                    key={c.id}
                    className="border-b border-card transition-colors hover:bg-card"
                    data-testid={`priority-case-row-${c.caseNumber}`}
                  >
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/cases/${c.id}`}
                        className="font-mono text-secondary hover:underline"
                        data-testid={`priority-case-link-${c.caseNumber}`}
                      >
                        {c.caseNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-text-primary">
                      {c.customerName}
                    </td>
                    <td className="py-2.5 pr-4">
                      <RiskScoreBadge score={c.riskScore} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-2.5 font-mono text-text-muted">
                      {ageDays}d
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
