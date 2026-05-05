import type { DashboardSummary } from "@/lib/types";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { PriorityCaseQueue } from "@/components/dashboard/priority-case-queue";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";

async function getDashboardSummary(): Promise<DashboardSummary> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/dashboard/summary`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch dashboard summary");
  }
  return res.json() as Promise<DashboardSummary>;
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const summary = await getDashboardSummary();

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <h1 className="font-mono text-2xl font-bold text-text-primary">
        Dashboard
      </h1>

      <DashboardCards
        totalOpenCases={summary.totalOpenCases}
        highRiskCases={summary.highRiskCases}
        pendingReviewerApproval={summary.pendingReviewerApproval}
        pendingStrFiling={summary.pendingStrFiling}
        averageCaseAgeDays={summary.averageCaseAgeDays}
        oldestCaseAgeDays={summary.oldestCaseAgeDays}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PriorityCaseQueue cases={summary.priorityCases} />
        <RecentActivityFeed activities={summary.recentActivity} />
      </div>
    </div>
  );
}
