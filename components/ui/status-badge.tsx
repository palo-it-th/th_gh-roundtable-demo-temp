import type { CaseStatus } from "@/lib/types";

const STATUS_STYLES: Record<CaseStatus, string> = {
  NEW: "bg-[#1E293B] text-secondary",
  UNDER_REVIEW: "bg-[#1E293B] text-secondary",
  PENDING_INFORMATION: "bg-[#2D1215] text-tertiary",
  PENDING_REVIEWER_APPROVAL: "bg-[#2D1215] text-tertiary",
  APPROVED_FOR_STR_FILING: "bg-[#0F2E1F] text-primary",
  CLOSED_NO_STR: "bg-[#1E293B] text-text-muted",
  CLOSED_STR_FILED: "bg-[#0F2E1F] text-primary",
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  NEW: "New",
  UNDER_REVIEW: "Under Review",
  PENDING_INFORMATION: "Pending Information",
  PENDING_REVIEWER_APPROVAL: "Pending Approval",
  APPROVED_FOR_STR_FILING: "Approved for Filing",
  CLOSED_NO_STR: "Closed (No STR)",
  CLOSED_STR_FILED: "Closed (STR Filed)",
};

interface StatusBadgeProps {
  status: CaseStatus;
}

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${STATUS_STYLES[status]}`}
      data-testid="status-badge"
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
