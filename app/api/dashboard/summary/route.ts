import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CaseStatus } from '@prisma/client';

const OPEN_STATUS_FILTER = {
  notIn: [CaseStatus.CLOSED_NO_STR, CaseStatus.CLOSED_STR_FILED],
};

export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();

    const [
      totalOpenCases,
      highRiskCases,
      pendingReviewerApproval,
      pendingStrFiling,
      openCases,
      priorityCases,
      recentActivity,
    ] = await Promise.all([
      prisma.amlCase.count({
        where: { status: OPEN_STATUS_FILTER },
      }),

      prisma.amlCase.count({
        where: {
          status: OPEN_STATUS_FILTER,
          riskScore: { gte: 76 },
        },
      }),

      prisma.amlCase.count({
        where: { status: 'PENDING_REVIEWER_APPROVAL' },
      }),

      prisma.amlCase.count({
        where: { status: 'APPROVED_FOR_STR_FILING' },
      }),

      prisma.amlCase.findMany({
        where: { status: OPEN_STATUS_FILTER },
        select: { createdAt: true },
      }),

      prisma.amlCase.findMany({
        where: { status: OPEN_STATUS_FILTER },
        orderBy: { riskScore: 'desc' },
        take: 5,
        include: {
          customer: { select: { name: true } },
        },
      }),

      prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          case: { select: { caseNumber: true } },
        },
      }),
    ]);

    // Calculate age metrics from open cases
    let averageCaseAgeDays = 0;
    let oldestCaseAgeDays = 0;

    if (openCases.length > 0) {
      const ages = openCases.map(
        (c) => (now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      averageCaseAgeDays = Math.round(
        ages.reduce((sum, age) => sum + age, 0) / ages.length
      );
      oldestCaseAgeDays = Math.round(Math.max(...ages));
    }

    return NextResponse.json({
      totalOpenCases,
      highRiskCases,
      pendingReviewerApproval,
      pendingStrFiling,
      averageCaseAgeDays,
      oldestCaseAgeDays,
      priorityCases: priorityCases.map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        customerName: c.customer.name,
        riskScore: c.riskScore,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        caseId: a.caseId,
        caseNumber: a.case.caseNumber,
        actor: a.actor,
        action: a.action,
        details: a.details,
        timestamp: a.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}
