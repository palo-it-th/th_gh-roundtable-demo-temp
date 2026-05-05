import { notFound } from "next/navigation";
import type { CaseDetail } from "@/lib/types";
import { CaseHeader } from "@/components/case-detail/case-header";
import { CustomerProfilePanel } from "@/components/case-detail/customer-profile-panel";
import { AlertSummaryPanel } from "@/components/case-detail/alert-summary-panel";
import { TransactionTimeline } from "@/components/case-detail/transaction-timeline";
import { RiskIndicatorsList } from "@/components/case-detail/risk-indicators-list";
import { InvestigationNotesPanel } from "@/components/case-detail/investigation-notes-panel";
import { AuditLogPanel } from "@/components/case-detail/audit-log-panel";
import { NoteForm } from "@/components/case-detail/note-form";
import { DecisionForm } from "@/components/case-detail/decision-form";
import { ReviewerDecisionForm } from "@/components/case-detail/reviewer-decision-form";
import { FilingStatusForm } from "@/components/case-detail/filing-status-form";

async function getCaseDetail(id: string): Promise<CaseDetail | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/cases/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch case detail");
  }
  return res.json() as Promise<CaseDetail>;
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const caseData = await getCaseDetail(id);

  if (!caseData) {
    notFound();
  }

  return (
    <div className="space-y-6" data-testid="case-detail-page">
      <CaseHeader
        caseNumber={caseData.caseNumber}
        customerName={caseData.customer.name}
        status={caseData.status}
        riskScore={caseData.riskScore}
        assignedAnalyst={caseData.assignedAnalyst}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CustomerProfilePanel customer={caseData.customer} />
        <AlertSummaryPanel
          alertType={caseData.alertType}
          alertReason={caseData.alertReason}
          totalAmount={caseData.totalAmount}
          createdAt={caseData.createdAt}
        />
      </div>

      <TransactionTimeline transactions={caseData.transactions} />
      <RiskIndicatorsList indicators={caseData.riskIndicators} />
      <InvestigationNotesPanel notes={caseData.notes} />
      <NoteForm caseId={caseData.id} />
      <DecisionForm
        caseId={caseData.id}
        caseStatus={caseData.status}
        hasExistingDecision={caseData.decision !== null}
      />
      <ReviewerDecisionForm
        caseId={caseData.id}
        caseStatus={caseData.status}
        decision={caseData.decision}
      />
      <FilingStatusForm
        caseId={caseData.id}
        caseStatus={caseData.status}
        decision={caseData.decision}
      />
      <AuditLogPanel entries={caseData.auditLog} />
    </div>
  );
}
