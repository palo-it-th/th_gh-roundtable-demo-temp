"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CaseListItem } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { RiskScoreBadge } from "@/components/ui/risk-score-badge";

interface CaseTableProps {
  cases: CaseListItem[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const RISK_RATING_STYLES: Record<string, string> = {
  LOW: "bg-[#0F2E1F] text-primary",
  MEDIUM: "bg-[#1E293B] text-tertiary",
  HIGH: "bg-[#2D1215] text-error",
};

export function CaseTable({ cases }: CaseTableProps): React.ReactElement {
  const router = useRouter();

  if (cases.length === 0) {
    return (
      <div
        className="rounded-md border border-card-border bg-card p-10 text-center"
        data-testid="case-table-empty"
      >
        <p className="text-text-muted">No cases found.</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-md border border-card-border bg-card"
      data-testid="case-table"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border text-left text-xs text-text-muted">
            <th className="px-4 py-3">Case #</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Risk Rating</th>
            <th className="px-4 py-3">Alert Type</th>
            <th className="px-4 py-3">Risk Score</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Analyst</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr
              key={c.id}
              className="border-b border-[#1E293B] cursor-pointer transition-colors hover:bg-[#1E293B]"
              onClick={() => router.push(`/cases/${c.id}`)}
              data-testid={`case-row-${c.caseNumber}`}
            >
              <td className="px-4 py-3">
                <Link
                  href={`/cases/${c.id}`}
                  className="font-mono text-secondary hover:underline"
                  data-testid={`case-link-${c.caseNumber}`}
                >
                  {c.caseNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-text-primary">{c.customer.name}</td>
              <td className="px-4 py-3 text-text-secondary">{c.customer.type}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 font-mono text-xs font-medium ${RISK_RATING_STYLES[c.customer.riskRating]}`}
                >
                  {c.customer.riskRating}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{c.alertType}</td>
              <td className="px-4 py-3">
                <RiskScoreBadge score={c.riskScore} />
              </td>
              <td className="px-4 py-3 font-mono text-text-primary">
                {formatCurrency(c.totalAmount)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3 text-text-secondary">{c.assignedAnalyst}</td>
              <td className="px-4 py-3 text-text-muted">
                {new Date(c.updatedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
