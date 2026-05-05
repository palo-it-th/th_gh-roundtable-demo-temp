// ─── Enums ───────────────────────────────────────────────

export type CustomerType = "INDIVIDUAL" | "CORPORATE";

export type RiskRating = "LOW" | "MEDIUM" | "HIGH";

export type CaseStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "PENDING_INFORMATION"
  | "PENDING_REVIEWER_APPROVAL"
  | "APPROVED_FOR_STR_FILING"
  | "CLOSED_NO_STR"
  | "CLOSED_STR_FILED";

export type TransactionDirection = "INCOMING" | "OUTGOING";

export type NoteType =
  | "CUSTOMER_PROFILE_REVIEW"
  | "TRANSACTION_REVIEW"
  | "COUNTERPARTY_REVIEW"
  | "CUSTOMER_OUTREACH"
  | "DECISION_RATIONALE";

export type FilingStatus = "NOT_STARTED" | "DRAFTING" | "READY_FOR_FILING" | "FILED";

export type Role = "Analyst" | "Reviewer" | "Operations Manager";

// ─── API Response Types ──────────────────────────────────

export interface DashboardSummary {
  totalOpenCases: number;
  highRiskCases: number;
  pendingReviewerApproval: number;
  pendingStrFiling: number;
  averageCaseAgeDays: number;
  oldestCaseAgeDays: number;
  priorityCases: PriorityCase[];
  recentActivity: ActivityEntry[];
}

export interface PriorityCase {
  id: string;
  caseNumber: string;
  customerName: string;
  riskScore: number;
  status: CaseStatus;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  caseId: string;
  caseNumber: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface CaseListItem {
  id: string;
  caseNumber: string;
  customer: {
    id: string;
    name: string;
    type: CustomerType;
    riskRating: RiskRating;
  };
  alertType: string;
  riskScore: number;
  totalAmount: number;
  status: CaseStatus;
  assignedAnalyst: string;
  updatedAt: string;
}

export interface CaseListResponse {
  cases: CaseListItem[];
}

export interface CaseDetail {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  riskScore: number;
  alertType: string;
  alertReason: string;
  riskIndicators: string[];
  totalAmount: number;
  assignedAnalyst: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    type: CustomerType;
    riskRating: RiskRating;
    businessActivity: string;
    accountOpenDate: string;
    sourceOfWealth: string;
    nationality: string;
  };
  transactions: CaseTransaction[];
  notes: CaseNote[];
  decision: CaseDecision | null;
  auditLog: AuditLogEntry[];
}

export interface CaseTransaction {
  id: string;
  direction: TransactionDirection;
  amount: number;
  currency: string;
  counterparty: string;
  country: string;
  date: string;
  purpose: string;
}

export interface CaseNote {
  id: string;
  noteType: NoteType;
  author: string;
  content: string;
  createdAt: string;
}

export interface CaseDecision {
  id: string;
  suspicionEstablished: boolean | null;
  suspicionReason: string | null;
  analystRecommendation: string | null;
  reviewerDecision: string | null;
  reviewerComment: string | null;
  filingStatus: FilingStatus;
  filingReference: string | null;
  filedAt: string | null;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}
