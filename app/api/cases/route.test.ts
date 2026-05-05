import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => import('@/lib/__mocks__/db'));

import { prisma } from '@/lib/db';
import { GET } from './route';

const mockPrisma = prisma as unknown as {
  amlCase: {
    findMany: ReturnType<typeof vi.fn>;
  };
};

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/cases');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

const baseCaseData = {
  id: 'case-1',
  caseNumber: 'AML-2026-001',
  customer: { id: 'cust-1', name: 'Acme Corp', type: 'CORPORATE', riskRating: 'HIGH' },
  alertType: 'UNUSUAL_TRANSACTION',
  riskScore: 85,
  totalAmount: 150000,
  status: 'UNDER_REVIEW',
  assignedAnalyst: 'analyst@bank.com',
  updatedAt: new Date('2026-04-14T10:00:00Z'),
};

describe('GET /api/cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cases with default params', async () => {
    mockPrisma.amlCase.findMany.mockResolvedValueOnce([baseCaseData]);

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cases).toHaveLength(1);
    expect(body.cases[0]).toEqual({
      id: 'case-1',
      caseNumber: 'AML-2026-001',
      customer: { id: 'cust-1', name: 'Acme Corp', type: 'CORPORATE', riskRating: 'HIGH' },
      alertType: 'UNUSUAL_TRANSACTION',
      riskScore: 85,
      totalAmount: 150000,
      status: 'UNDER_REVIEW',
      assignedAnalyst: 'analyst@bank.com',
      updatedAt: '2026-04-14T10:00:00.000Z',
    });
  });

  it('applies search filter for partial caseNumber match', async () => {
    mockPrisma.amlCase.findMany.mockResolvedValueOnce([]);

    await GET(makeRequest({ search: '2026-001' }));

    const call = mockPrisma.amlCase.findMany.mock.calls[0][0];
    expect(call.where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          caseNumber: { contains: '2026-001', mode: 'insensitive' },
        }),
      ])
    );
  });

  it('applies status filter', async () => {
    mockPrisma.amlCase.findMany.mockResolvedValueOnce([]);

    await GET(makeRequest({ status: 'NEW' }));

    const call = mockPrisma.amlCase.findMany.mock.calls[0][0];
    expect(call.where.status).toBe('NEW');
  });

  it('applies riskRating filter', async () => {
    mockPrisma.amlCase.findMany.mockResolvedValueOnce([]);

    await GET(makeRequest({ riskRating: 'HIGH' }));

    const call = mockPrisma.amlCase.findMany.mock.calls[0][0];
    expect(call.where.customer).toEqual({ riskRating: 'HIGH' });
  });

  it('sorts by riskScore when requested', async () => {
    mockPrisma.amlCase.findMany.mockResolvedValueOnce([]);

    await GET(makeRequest({ sortBy: 'riskScore', sortOrder: 'desc' }));

    const call = mockPrisma.amlCase.findMany.mock.calls[0][0];
    expect(call.orderBy).toEqual({ riskScore: 'desc' });
  });

  it('returns 400 for invalid query params', async () => {
    const response = await GET(makeRequest({ status: 'INVALID_STATUS' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid query parameters');
    expect(body.details).toBeDefined();
  });

  it('returns 500 when Prisma throws', async () => {
    mockPrisma.amlCase.findMany.mockRejectedValueOnce(new Error('DB down'));

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch cases' });
  });
});
