"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import type { CaseStatus } from "@/lib/types";

interface DecisionFormProps {
  caseId: string;
  caseStatus: CaseStatus;
  hasExistingDecision: boolean;
}

const ALLOWED_STATUSES: CaseStatus[] = ["UNDER_REVIEW", "PENDING_INFORMATION"];

export function DecisionForm({
  caseId,
  caseStatus,
  hasExistingDecision,
}: DecisionFormProps): React.ReactElement | null {
  const router = useRouter();
  const { role } = useRole();
  const [suspicionEstablished, setSuspicionEstablished] = useState<boolean | null>(null);
  const [suspicionReason, setSuspicionReason] = useState("");
  const [analystRecommendation, setAnalystRecommendation] = useState("");
  const [errors, setErrors] = useState<{
    suspicionEstablished?: string;
    suspicionReason?: string;
    analystRecommendation?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (role !== "Analyst" || !ALLOWED_STATUSES.includes(caseStatus) || hasExistingDecision) {
    return null;
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (suspicionEstablished === null) {
      newErrors.suspicionEstablished = "Select whether suspicion is established";
    }
    if (!suspicionReason.trim()) {
      newErrors.suspicionReason = "Rationale is required";
    }
    if (!analystRecommendation.trim()) {
      newErrors.analystRecommendation = "Recommendation is required";
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
      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suspicionEstablished,
          suspicionReason: suspicionReason.trim(),
          analystRecommendation: analystRecommendation.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ general: data.error ?? "Failed to submit recommendation" });
        return;
      }

      setSuccessMessage("Recommendation submitted successfully");
      router.refresh();
    } catch {
      setErrors({ general: "Network error — please try again" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="decision-form"
    >
      <h2 className="font-mono text-base font-bold text-text-primary">
        STR Recommendation
      </h2>

      <div className="mt-4 space-y-4">
        {/* Suspicion Established */}
        <fieldset>
          <legend className="block text-sm font-medium text-text-secondary">
            Suspicion Established
          </legend>
          <div className="mt-2 flex gap-6">
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="radio"
                name="suspicionEstablished"
                checked={suspicionEstablished === true}
                onChange={() => {
                  setSuspicionEstablished(true);
                  if (errors.suspicionEstablished)
                    setErrors((prev) => ({ ...prev, suspicionEstablished: undefined }));
                }}
                disabled={isSubmitting}
                className="accent-primary"
                data-testid="suspicion-yes"
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="radio"
                name="suspicionEstablished"
                checked={suspicionEstablished === false}
                onChange={() => {
                  setSuspicionEstablished(false);
                  if (errors.suspicionEstablished)
                    setErrors((prev) => ({ ...prev, suspicionEstablished: undefined }));
                }}
                disabled={isSubmitting}
                className="accent-primary"
                data-testid="suspicion-no"
              />
              No
            </label>
          </div>
          {errors.suspicionEstablished && (
            <p className="mt-1 text-xs text-error" data-testid="suspicion-error">
              {errors.suspicionEstablished}
            </p>
          )}
        </fieldset>

        {/* Rationale */}
        <div>
          <label
            htmlFor="suspicion-reason"
            className="block text-sm font-medium text-text-secondary"
          >
            Rationale
          </label>
          <textarea
            id="suspicion-reason"
            rows={3}
            value={suspicionReason}
            onChange={(e) => {
              setSuspicionReason(e.target.value);
              if (errors.suspicionReason)
                setErrors((prev) => ({ ...prev, suspicionReason: undefined }));
            }}
            disabled={isSubmitting}
            placeholder="Explain the basis for your assessment…"
            className="mt-1 w-full rounded border border-card-border bg-surface-base px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none disabled:opacity-35"
            data-testid="suspicion-reason-textarea"
          />
          {errors.suspicionReason && (
            <p className="mt-1 text-xs text-error" data-testid="suspicion-reason-error">
              {errors.suspicionReason}
            </p>
          )}
        </div>

        {/* Recommendation */}
        <div>
          <label
            htmlFor="analyst-recommendation"
            className="block text-sm font-medium text-text-secondary"
          >
            Recommendation
          </label>
          <textarea
            id="analyst-recommendation"
            rows={3}
            value={analystRecommendation}
            onChange={(e) => {
              setAnalystRecommendation(e.target.value);
              if (errors.analystRecommendation)
                setErrors((prev) => ({ ...prev, analystRecommendation: undefined }));
            }}
            disabled={isSubmitting}
            placeholder="State your recommendation…"
            className="mt-1 w-full rounded border border-card-border bg-surface-base px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none disabled:opacity-35"
            data-testid="analyst-recommendation-textarea"
          />
          {errors.analystRecommendation && (
            <p className="mt-1 text-xs text-error" data-testid="recommendation-error">
              {errors.analystRecommendation}
            </p>
          )}
        </div>

        {/* General error */}
        {errors.general && (
          <p className="text-sm text-error" data-testid="decision-general-error">
            {errors.general}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface-base hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-35"
            data-testid="decision-submit-button"
          >
            {isSubmitting ? "Submitting…" : "Submit Recommendation"}
          </button>

          {successMessage && (
            <span
              className="text-sm text-primary"
              data-testid="decision-success-message"
            >
              {successMessage}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
