import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => import('@/lib/__mocks__/db'));

import { prisma } from '@/lib/db';
import { GET } from './route';

const mockPrisma = prisma as unknown as {
  amlCase: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

function makeRequest(): Request {
  return new Request('http://localhost:3000/api/cases/case-1');
}

const fullCaseData = {
  id: 'case-1',
  caseNumber: 'AML-2026-001',
  status: 'UNDER_REVIEW',
  riskScore: 85,
  alertType: 'UNUSUAL_TRANSACTION',
  alertReason: 'Large outbound transfers to high-risk jurisdiction',
  riskIndicators: ['High-risk country', 'Structuring patterns'],
  totalAmount: 150000,
  assignedAnalyst: 'analyst@bank.com',
  createdAt: new Date('2026-04-01T00:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
  customer: {
    id: 'cust-1',
    name: 'Acme Corp',
    type: 'CORPORATE',
    riskRating: 'HIGH',
    businessActivity: 'Import/Export Trading',
    accountOpenDate: new Date('2024-01-15T00:00:00Z'),
    sourceOfWealth: 'Business Revenue',
    nationality: 'SG',
  },
  transactions: [
    {
      id: 'txn-1',
      direction: 'OUTGOING',
      amount: 50000,
      currency: 'THB',
      counterparty: 'Offshore Ltd',
      country: 'VG',
      date: new Date('2026-03-20T00:00:00Z'),
      purpose: 'Trade settlement',
    },
  ],
  notes: [
    {
      id: 'note-1',
      noteType: 'TRANSACTION_REVIEW',
      author: 'analyst@bank.com',
      content: 'Reviewed counterparty details',
      createdAt: new Date('2026-04-05T00:00:00Z'),
    },
  ],
  decision: {
    id: 'dec-1',
    suspicionEstablished: true,
    suspicionReason: 'Funds flow to shell company',
    analystRecommendation: 'File STR',
    reviewerDecision: 'approved',
    reviewerComment: 'Agreed',
    filingStatus: 'FILED',
    filingReference: 'STR-2026-001',
    filedAt: new Date('2026-04-12T00:00:00Z'),
  },
  auditLog: [
    {
      id: 'log-1',
      actor: 'analyst@bank.com',
      action: 'CASE_OPENED',
      details: 'Case created',
      timestamp: new Date('2026-04-01T00:00:00Z'),
    },
  ],
};

describe('GET /api/cases/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns full case with all relations for a valid ID', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce(fullCaseData);

    const response = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe('case-1');
    expect(body.caseNumber).toBe('AML-2026-001');
    expect(body.customer.name).toBe('Acme Corp');
    expect(body.customer.accountOpenDate).toBe('2024-01-15T00:00:00.000Z');
    expect(body.transactions).toHaveLength(1);
    expect(body.transactions[0].date).toBe('2026-03-20T00:00:00.000Z');
    expect(body.notes).toHaveLength(1);
    expect(body.notes[0].createdAt).toBe('2026-04-05T00:00:00.000Z');
    expect(body.decision).toBeDefined();
    expect(body.decision.filedAt).toBe('2026-04-12T00:00:00.000Z');
    expect(body.auditLog).toHaveLength(1);
  });

  it('returns case with null decision when no STR decision exists', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      ...fullCaseData,
      decision: null,
    });

    const response = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.decision).toBeNull();
  });

  it('returns 404 for non-existent case', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce(null);

    const response = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Case not found' });
  });

  it('returns 500 when Prisma throws', async () => {
    mockPrisma.amlCase.findUnique.mockRejectedValueOnce(new Error('DB down'));

    const response = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch case details' });
  });
});
