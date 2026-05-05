"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import type { NoteType } from "@/lib/types";

interface NoteFormProps {
  caseId: string;
}

const NOTE_TYPE_OPTIONS: { value: NoteType; label: string }[] = [
  { value: "CUSTOMER_PROFILE_REVIEW", label: "Customer Profile Review" },
  { value: "TRANSACTION_REVIEW", label: "Transaction Review" },
  { value: "COUNTERPARTY_REVIEW", label: "Counterparty Review" },
  { value: "CUSTOMER_OUTREACH", label: "Customer Outreach" },
  { value: "DECISION_RATIONALE", label: "Decision Rationale" },
];

export function NoteForm({ caseId }: NoteFormProps): React.ReactElement | null {
  const router = useRouter();
  const { role } = useRole();
  const [noteType, setNoteType] = useState<NoteType | "">("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<{ noteType?: string; content?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (role === "Operations Manager") {
    return null;
  }

  function validate(): boolean {
    const newErrors: { noteType?: string; content?: string } = {};
    if (!noteType) {
      newErrors.noteType = "Note type is required";
    }
    if (!content.trim()) {
      newErrors.content = "Content is required";
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
      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteType,
          content: content.trim(),
          author: role,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ content: data.error ?? "Failed to add note" });
        return;
      }

      setNoteType("");
      setContent("");
      setErrors({});
      setSuccessMessage("Note added successfully");
      router.refresh();

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrors({ content: "Network error — please try again" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="note-form"
    >
      <h2 className="font-mono text-base font-bold text-text-primary">
        Add Investigation Note
      </h2>

      <div className="mt-4 space-y-4">
        {/* Note Type */}
        <div>
          <label
            htmlFor="note-type"
            className="block text-sm font-medium text-text-secondary"
          >
            Note Type
          </label>
          <select
            id="note-type"
            value={noteType}
            onChange={(e) => {
              setNoteType(e.target.value as NoteType);
              if (errors.noteType) setErrors((prev) => ({ ...prev, noteType: undefined }));
            }}
            disabled={isSubmitting}
            className="mt-1 w-full rounded border border-card-border bg-surface-base px-3 py-2 font-mono text-sm text-text-primary focus:border-primary focus:outline-none disabled:opacity-35"
            data-testid="note-type-select"
          >
            <option value="">Select note type…</option>
            {NOTE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.noteType && (
            <p className="mt-1 text-xs text-error" data-testid="note-type-error">
              {errors.noteType}
            </p>
          )}
        </div>

        {/* Content */}
        <div>
          <label
            htmlFor="note-content"
            className="block text-sm font-medium text-text-secondary"
          >
            Content
          </label>
          <textarea
            id="note-content"
            rows={4}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
            }}
            disabled={isSubmitting}
            placeholder="Enter investigation notes…"
            className="mt-1 w-full rounded border border-card-border bg-surface-base px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none disabled:opacity-35"
            data-testid="note-content-textarea"
          />
          {errors.content && (
            <p className="mt-1 text-xs text-error" data-testid="note-content-error">
              {errors.content}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface-base hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-35"
            data-testid="note-submit-button"
          >
            {isSubmitting ? "Adding…" : "Add Note"}
          </button>

          {successMessage && (
            <span
              className="text-sm text-primary"
              data-testid="note-success-message"
            >
              {successMessage}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
