import { Suspense } from "react";
import type { CaseListResponse } from "@/lib/types";
import { CaseTable } from "@/components/cases/case-table";
import { CaseSearchBar } from "@/components/cases/case-search-bar";
import { CaseFilters } from "@/components/cases/case-filters";

interface CaseListPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getCases(params: Record<string, string | string[] | undefined>): Promise<CaseListResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) {
      query.set(key, value);
    }
  }
  const res = await fetch(`${baseUrl}/api/cases?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch cases");
  }
  return res.json() as Promise<CaseListResponse>;
}

export default async function CaseListPage({ searchParams }: CaseListPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { cases } = await getCases(params);

  return (
    <div className="space-y-6" data-testid="case-list-page">
      <h1 className="font-mono text-2xl font-bold text-text-primary">
        Cases
      </h1>
      <div className="space-y-4">
        <Suspense fallback={<div className="h-10 w-80 animate-pulse rounded-md bg-card" />}>
          <CaseSearchBar />
        </Suspense>
        <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-card" />}>
          <CaseFilters />
        </Suspense>
      </div>
      <CaseTable cases={cases} />
    </div>
  );
}
