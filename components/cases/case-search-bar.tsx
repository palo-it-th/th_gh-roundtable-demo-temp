"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function CaseSearchBar(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  function updateSearch(term: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    router.push(`/cases?${params.toString()}`);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const newValue = e.target.value;
    setValue(newValue);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      updateSearch(newValue);
    }, 300);
  }

  return (
    <input
      type="text"
      placeholder="Search by case number or customer name…"
      value={value}
      onChange={handleChange}
      className="w-full rounded-md border border-card-border bg-surface-base px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-80"
      data-testid="case-search-input"
    />
  );
}
