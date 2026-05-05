"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "PENDING_INFORMATION", label: "Pending Information" },
  { value: "PENDING_REVIEWER_APPROVAL", label: "Pending Reviewer Approval" },
  { value: "APPROVED_FOR_STR_FILING", label: "Approved for STR Filing" },
  { value: "CLOSED_NO_STR", label: "Closed - No STR" },
  { value: "CLOSED_STR_FILED", label: "Closed - STR Filed" },
] as const;

const RISK_RATING_OPTIONS = [
  { value: "", label: "All Risk Ratings" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
] as const;

const SORT_OPTIONS = [
  { value: "updatedAt", label: "Last Updated" },
  { value: "riskScore", label: "Risk Score" },
] as const;

function FilterSelect({
  label,
  paramKey,
  options,
  testId,
}: {
  label: string;
  paramKey: string;
  options: readonly { value: string; label: string }[];
  testId: string;
}): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramKey) ?? "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set(paramKey, e.target.value);
    } else {
      params.delete(paramKey);
    }
    router.push(`/cases?${params.toString()}`);
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <select
        value={current}
        onChange={handleChange}
        className="rounded-md border border-card-border bg-surface-base px-3 py-2 font-mono text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        data-testid={testId}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CaseFilters(): React.ReactElement {
  return (
    <div className="flex flex-wrap items-end gap-4" data-testid="case-filters">
      <FilterSelect
        label="Status"
        paramKey="status"
        options={STATUS_OPTIONS}
        testId="case-filter-status"
      />
      <FilterSelect
        label="Risk Rating"
        paramKey="riskRating"
        options={RISK_RATING_OPTIONS}
        testId="case-filter-risk-rating"
      />
      <FilterSelect
        label="Sort By"
        paramKey="sortBy"
        options={SORT_OPTIONS}
        testId="case-filter-sort"
      />
    </div>
  );
}
