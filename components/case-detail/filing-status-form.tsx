"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import type { CaseStatus, CaseDecision, FilingStatus } from "@/lib/types";

interface FilingStatusFormProps {
  caseId: string;
  caseStatus: CaseStatus;
  decision: CaseDecision | null;
}

const FILING_STATUS_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: "DRAFTING", label: "Drafting" },
  { value: "READY_FOR_FILING", label: "Ready for Filing" },
  { value: "FILED", label: "Filed" },
];

const FILING_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  DRAFTING: "Drafting",
  READY_FOR_FILING: "Ready for Filing",
  FILED: "Filed",
};

export function FilingStatusForm({
  caseId,
  caseStatus,
  decision,
}: FilingStatusFormProps): React.ReactElement | null {
  const router = useRouter();
  const { role } = useRole();
  const [filingStatus, setFilingStatus] = useState<FilingStatus | "">("");
  const [filingReference, setFilingReference] = useState("");
  const [filedAt, setFiledAt] = useState("");
  const [errors, setErrors] = useState<{
    filingStatus?: string;
    filingReference?: string;
    filedAt?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (role !== "Reviewer" || caseStatus !== "APPROVED_FOR_STR_FILING") {
    return null;
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!filingStatus) {
      newErrors.filingStatus = "Filing status is required";
    }
    if (filingStatus === "FILED") {
      if (!filingReference.trim()) {
        newErrors.filingReference = "Filing reference is required";
      }
      if (!filedAt) {
        newErrors.filedAt = "Filing date is required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const body: Record<string, string> = { filingStatus };
      if (filingStatus === "FILED") {
        body.filingReference = filingReference.trim();
        body.filedAt = filedAt;
      }

      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/filing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ general: data.error ?? "Failed to update filing status" });
        return;
      }

      setSuccessMessage("Filing status updated successfully");
      router.refresh();

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrors({ general: "Network error — please try again" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentStatusLabel =
    FILING_STATUS_LABELS[decision?.filingStatus ?? ""] ?? "Unknown";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="filing-status-form"
    >
      <h2 className="font-mono text-base font-bold text-text-primary">
        STR Filing Status
      </h2>

      <p className="mt-2 text-sm text-text-secondary">
        Current status:{" "}
        <span className="font-medium text-text-primary" data-testid="current-filing-status">
          {currentStatusLabel}
        </span>
      </p>

      <div className="mt-4 space-y-4">
        {/* Filing Status */}
        <div>
          <label
            htmlFor="filing-status"
            className="block text-sm font-medium text-text-secondary"
          >
            Update Status
          </label>
          <select
            id="filing-status"
            value={filingStatus}
            onChange={(e) => {
              setFilingStatus(e.target.value as FilingStatus);
              if (errors.filingStatus)
                setErrors((prev) => ({ ...prev, filingStatus: undefined }));
            }}
            disabled={isSubmitting}
            className="mt-1 w-full rounded border border-card-border bg-surface-base px-3 py-2 font-mono text-sm text-text-primary focus:border-primary focus:outline-none disabled:opacity-35"
            data-testid="filing-status-select"
          >
            <option value="">Select status…</option>
            {FILING_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.filingStatus && (
            <p className="mt-1 text-xs text-error" data-testid="filing-status-error">
              {errors.filingStatus}
            </p>
          )}
        </div>

        {/* Filed-specific fields */}
        {filingStatus === "FILED" && (
          <>
            <div>
              <label
                htmlFor="filing-reference"
                className="block text-sm font-medium text-text-secondary"
              >
                Filing Reference
              </label>
              <input
                id="filing-reference"
                type="text"
                value={filingReference}
                onChange={(e) => {
                  setFilingReference(e.target.value);
                  if (errors.filingReference)
                    setErrors((prev) => ({ ...prev, filingReference: undefined }));
                }}
                disabled={isSubmitting}
                placeholder="Enter SONAR reference number…"
                className="mt-1 w-full rounded border border-card-border bg-surface-base px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none disabled:opacity-35"
                data-testid="filing-reference-input"
              />
              {errors.filingReference && (
                <p className="mt-1 text-xs text-error" data-testid="filing-reference-error">
                  {errors.filingReference}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="filing-date"
                className="block text-sm font-medium text-text-secondary"
              >
                Filing Date
              </label>
              <input
                id="filing-date"
                type="date"
                value={filedAt}
                onChange={(e) => {
                  setFiledAt(e.target.value);
                  if (errors.filedAt)
                    setErrors((prev) => ({ ...prev, filedAt: undefined }));
                }}
                disabled={isSubmitting}
                className="mt-1 w-full rounded border border-card-border bg-surface-base px-3 py-2 font-mono text-sm text-text-primary focus:border-primary focus:outline-none disabled:opacity-35"
                data-testid="filing-date-input"
              />
              {errors.filedAt && (
                <p className="mt-1 text-xs text-error" data-testid="filing-date-error">
                  {errors.filedAt}
                </p>
              )}
            </div>
          </>
        )}

        {/* General error */}
        {errors.general && (
          <p className="text-sm text-error" data-testid="filing-general-error">
            {errors.general}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !filingStatus}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface-base hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-35"
            data-testid="filing-submit-button"
          >
            {isSubmitting ? "Updating…" : "Update Filing Status"}
          </button>

          {successMessage && (
            <span
              className="text-sm text-primary"
              data-testid="filing-success-message"
            >
              {successMessage}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
