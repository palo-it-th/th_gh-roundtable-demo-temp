import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/db', () => import('@/lib/__mocks__/db'));

import { prisma } from '@/lib/db';
import { GET } from './route';

const mockPrisma = prisma as unknown as {
  amlCase: {
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  auditLog: {
    findMany: ReturnType<typeof vi.fn>;
  };
};

describe('GET /api/dashboard/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct dashboard summary structure', async () => {
    const now = new Date('2026-04-15T00:00:00Z');
    vi.setSystemTime(now);

    mockPrisma.amlCase.count
      .mockResolvedValueOnce(5) // totalOpenCases
      .mockResolvedValueOnce(2) // highRiskCases
      .mockResolvedValueOnce(1) // pendingReviewerApproval
      .mockResolvedValueOnce(1); // pendingStrFiling

    mockPrisma.amlCase.findMany
      .mockResolvedValueOnce([
        // openCases (for age calculation)
        { createdAt: new Date('2026-04-10T00:00:00Z') },
        { createdAt: new Date('2026-04-05T00:00:00Z') },
      ])
      .mockResolvedValueOnce([
        // priorityCases
        {
          id: 'case-1',
          caseNumber: 'AML-2026-001',
          customer: { name: 'Acme Corp' },
          riskScore: 92,
          status: 'UNDER_REVIEW',
          createdAt: new Date('2026-04-10T00:00:00Z'),
        },
      ]);

    mockPrisma.auditLog.findMany.mockResolvedValueOnce([
      {
        id: 'log-1',
        caseId: 'case-1',
        case: { caseNumber: 'AML-2026-001' },
        actor: 'analyst@bank.com',
        action: 'CASE_OPENED',
        details: 'Case created',
        timestamp: new Date('2026-04-14T10:00:00Z'),
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      totalOpenCases: 5,
      highRiskCases: 2,
      pendingReviewerApproval: 1,
      pendingStrFiling: 1,
      averageCaseAgeDays: 8, // avg of 5 and 10 days
      oldestCaseAgeDays: 10,
      priorityCases: [
        {
          id: 'case-1',
          caseNumber: 'AML-2026-001',
          customerName: 'Acme Corp',
          riskScore: 92,
          status: 'UNDER_REVIEW',
          createdAt: '2026-04-10T00:00:00.000Z',
        },
      ],
      recentActivity: [
        {
          id: 'log-1',
          caseId: 'case-1',
          caseNumber: 'AML-2026-001',
          actor: 'analyst@bank.com',
          action: 'CASE_OPENED',
          details: 'Case created',
          timestamp: '2026-04-14T10:00:00.000Z',
        },
      ],
    });

    vi.useRealTimers();
  });

  it('filters highRiskCases by riskScore >= 76', async () => {
    mockPrisma.amlCase.count
      .mockResolvedValueOnce(10) // totalOpenCases
      .mockResolvedValueOnce(3)  // highRiskCases
      .mockResolvedValueOnce(0)  // pendingReviewerApproval
      .mockResolvedValueOnce(0); // pendingStrFiling

    mockPrisma.amlCase.findMany
      .mockResolvedValueOnce([]) // openCases
      .mockResolvedValueOnce([]); // priorityCases

    mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);

    await GET();

    // Second count call should filter by riskScore >= 76
    const highRiskCall = mockPrisma.amlCase.count.mock.calls[1][0];
    expect(highRiskCall).toEqual({
      where: {
        status: { notIn: ['CLOSED_NO_STR', 'CLOSED_STR_FILED'] },
        riskScore: { gte: 76 },
      },
    });
  });

  it('excludes CLOSED_NO_STR and CLOSED_STR_FILED from open case counts', async () => {
    mockPrisma.amlCase.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    mockPrisma.amlCase.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);

    await GET();

    // First count call (totalOpenCases) should exclude closed statuses
    const totalOpenCall = mockPrisma.amlCase.count.mock.calls[0][0];
    expect(totalOpenCall).toEqual({
      where: {
        status: { notIn: ['CLOSED_NO_STR', 'CLOSED_STR_FILED'] },
      },
    });
  });

  it('handles zero open cases for age calculation', async () => {
    mockPrisma.amlCase.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    mockPrisma.amlCase.findMany
      .mockResolvedValueOnce([])  // no open cases
      .mockResolvedValueOnce([]); // no priority cases

    mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);

    const response = await GET();
    const body = await response.json();

    expect(body.averageCaseAgeDays).toBe(0);
    expect(body.oldestCaseAgeDays).toBe(0);
  });

  it('returns 500 when Prisma throws', async () => {
    mockPrisma.amlCase.count.mockRejectedValueOnce(new Error('DB down'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch dashboard summary' });
  });
});
