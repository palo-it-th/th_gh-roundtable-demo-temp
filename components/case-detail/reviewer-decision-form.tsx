"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import type { CaseStatus, CaseDecision } from "@/lib/types";

interface ReviewerDecisionFormProps {
  caseId: string;
  caseStatus: CaseStatus;
  decision: CaseDecision | null;
}

export function ReviewerDecisionForm({
  caseId,
  caseStatus,
  decision,
}: ReviewerDecisionFormProps): React.ReactElement | null {
  const router = useRouter();
  const { role } = useRole();
  const [action, setAction] = useState<"approve" | "return" | null>(null);
  const [reviewerComment, setReviewerComment] = useState("");
  const [errors, setErrors] = useState<{
    reviewerComment?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (role !== "Reviewer" || caseStatus !== "PENDING_REVIEWER_APPROVAL") {
    return null;
  }

  async function handleSubmit(selectedAction: "approve" | "return"): Promise<void> {
    setAction(selectedAction);
    setErrors({});

    if (selectedAction === "return" && !reviewerComment.trim()) {
      setErrors({ reviewerComment: "Comment is required when returning a case" });
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const body =
        selectedAction === "approve"
          ? { reviewerDecision: "approved" }
          : { reviewerDecision: "returned", reviewerComment: reviewerComment.trim() };

      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ general: data.error ?? "Failed to submit decision" });
        return;
      }

      setSuccessMessage(
        selectedAction === "approve"
          ? "Case approved for STR filing"
          : "Case returned to analyst"
      );
      router.refresh();
    } catch {
      setErrors({ general: "Network error — please try again" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="reviewer-decision-form"
    >
      <h2 className="font-mono text-base font-bold text-text-primary">
        Reviewer Decision
      </h2>

      {/* Analyst recommendation summary */}
      {decision && (
        <div className="mt-4 rounded-md border border-tertiary/40 bg-tertiary/10 p-4" data-testid="analyst-recommendation-summary">
          <h3 className="font-mono text-sm font-medium text-tertiary">
            Analyst Recommendation
          </h3>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-xs font-medium text-text-secondary">
                Suspicion Established:
              </span>
              <span className="ml-2 text-sm text-text-primary">
                {decision.suspicionEstablished ? "Yes" : "No"}
              </span>
            </div>
            {decision.suspicionReason && (
              <div>
                <span className="text-xs font-medium text-text-secondary">
                  Rationale:
                </span>
                <p className="mt-1 text-sm text-text-primary">
                  {decision.suspicionReason}
                </p>
              </div>
            )}
            {decision.analystRecommendation && (
              <div>
                <span className="text-xs font-medium text-text-secondary">
                  Recommendation:
                </span>
                <p className="mt-1 text-sm text-text-primary">
                  {decision.analystRecommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {/* Return comment textarea */}
        <div>
          <label
            htmlFor="reviewer-comment"
            className="block text-sm font-medium text-text-secondary"
          >
            Comment (required for return)
          </label>
          <textarea
            id="reviewer-comment"
            rows={3}
            value={reviewerComment}
            onChange={(e) => {
              setReviewerComment(e.target.value);
              if (errors.reviewerComment)
                setErrors((prev) => ({ ...prev, reviewerComment: undefined }));
            }}
            disabled={isSubmitting}
            placeholder="Add reviewer comments…"
            className="mt-1 w-full rounded border border-card-border bg-surface-base px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none disabled:opacity-35"
            data-testid="reviewer-comment-textarea"
          />
          {errors.reviewerComment && (
            <p className="mt-1 text-xs text-error" data-testid="reviewer-comment-error">
              {errors.reviewerComment}
            </p>
          )}
        </div>

        {/* General error */}
        {errors.general && (
          <p className="text-sm text-error" data-testid="reviewer-general-error">
            {errors.general}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit("approve")}
            disabled={isSubmitting}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface-base hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-35"
            data-testid="reviewer-approve-button"
          >
            {isSubmitting && action === "approve" ? "Approving…" : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("return")}
            disabled={isSubmitting}
            className="rounded border border-card-border bg-transparent px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-editor disabled:cursor-not-allowed disabled:opacity-35"
            data-testid="reviewer-return-button"
          >
            {isSubmitting && action === "return" ? "Returning…" : "Return for More Info"}
          </button>

          {successMessage && (
            <span
              className="text-sm text-primary"
              data-testid="reviewer-success-message"
            >
              {successMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
