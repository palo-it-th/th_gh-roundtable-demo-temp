-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- CreateEnum
CREATE TYPE "RiskRating" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'PENDING_INFORMATION', 'PENDING_REVIEWER_APPROVAL', 'APPROVED_FOR_STR_FILING', 'CLOSED_NO_STR', 'CLOSED_STR_FILED');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('CUSTOMER_PROFILE_REVIEW', 'TRANSACTION_REVIEW', 'COUNTERPARTY_REVIEW', 'CUSTOMER_OUTREACH', 'DECISION_RATIONALE');

-- CreateEnum
CREATE TYPE "FilingStatus" AS ENUM ('NOT_STARTED', 'DRAFTING', 'READY_FOR_FILING', 'FILED');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL,
    "riskRating" "RiskRating" NOT NULL,
    "businessActivity" TEXT NOT NULL,
    "accountOpenDate" TIMESTAMP(3) NOT NULL,
    "sourceOfWealth" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aml_cases" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'NEW',
    "riskScore" INTEGER NOT NULL,
    "alertType" TEXT NOT NULL,
    "alertReason" TEXT NOT NULL,
    "riskIndicators" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "assignedAnalyst" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aml_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "counterparty" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigation_notes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "noteType" "NoteType" NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investigation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_decisions" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "suspicionEstablished" BOOLEAN,
    "suspicionReason" TEXT,
    "analystRecommendation" TEXT,
    "reviewerDecision" TEXT,
    "reviewerComment" TEXT,
    "filingStatus" "FilingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "filingReference" TEXT,
    "filedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aml_cases_caseNumber_key" ON "aml_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "aml_cases_status_idx" ON "aml_cases"("status");

-- CreateIndex
CREATE INDEX "aml_cases_riskScore_idx" ON "aml_cases"("riskScore");

-- CreateIndex
CREATE INDEX "aml_cases_customerId_idx" ON "aml_cases"("customerId");

-- CreateIndex
CREATE INDEX "transactions_caseId_idx" ON "transactions"("caseId");

-- CreateIndex
CREATE INDEX "investigation_notes_caseId_idx" ON "investigation_notes"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "str_decisions_caseId_key" ON "str_decisions"("caseId");

-- CreateIndex
CREATE INDEX "audit_log_caseId_idx" ON "audit_log"("caseId");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- AddForeignKey
ALTER TABLE "aml_cases" ADD CONSTRAINT "aml_cases_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "aml_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_notes" ADD CONSTRAINT "investigation_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "aml_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_decisions" ADD CONSTRAINT "str_decisions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "aml_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "aml_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
