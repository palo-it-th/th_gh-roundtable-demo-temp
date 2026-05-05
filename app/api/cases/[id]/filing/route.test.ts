import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => import('@/lib/__mocks__/db'));

import { prisma } from '@/lib/db';
import { PATCH } from './route';

const mockPrisma = prisma as unknown as {
  amlCase: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/cases/case-1/filing', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/cases/[id]/filing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates filing status to DRAFTING and returns 200', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'APPROVED_FOR_STR_FILING',
      caseNumber: 'AML-2026-001',
    });

    const updatedDecision = {
      id: 'dec-1',
      caseId: 'case-1',
      filingStatus: 'DRAFTING',
      filingReference: null,
      filedAt: null,
    };

    const mockTx = {
      strDecision: { update: vi.fn().mockResolvedValueOnce(updatedDecision) },
      amlCase: { update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    mockPrisma.$transaction.mockImplementationOnce(async (fn: Function) => fn(mockTx));

    const response = await PATCH(
      makeRequest({ filingStatus: 'DRAFTING' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filingStatus).toBe('DRAFTING');
    expect(body.filingReference).toBeNull();
    // Should NOT update case status for non-FILED statuses
    expect(mockTx.amlCase.update).not.toHaveBeenCalled();
  });

  it('updates filing status to READY_FOR_FILING and returns 200', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'APPROVED_FOR_STR_FILING',
      caseNumber: 'AML-2026-001',
    });

    const updatedDecision = {
      id: 'dec-1',
      caseId: 'case-1',
      filingStatus: 'READY_FOR_FILING',
      filingReference: null,
      filedAt: null,
    };

    const mockTx = {
      strDecision: { update: vi.fn().mockResolvedValueOnce(updatedDecision) },
      amlCase: { update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    mockPrisma.$transaction.mockImplementationOnce(async (fn: Function) => fn(mockTx));

    const response = await PATCH(
      makeRequest({ filingStatus: 'READY_FOR_FILING' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filingStatus).toBe('READY_FOR_FILING');
  });

  it('updates filing status to FILED with reference and closes case', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'APPROVED_FOR_STR_FILING',
      caseNumber: 'AML-2026-001',
    });

    const filedAt = '2026-05-04T10:00:00.000Z';
    const updatedDecision = {
      id: 'dec-1',
      caseId: 'case-1',
      filingStatus: 'FILED',
      filingReference: 'STR-2026-0042',
      filedAt: new Date(filedAt),
    };

    const mockTx = {
      strDecision: { update: vi.fn().mockResolvedValueOnce(updatedDecision) },
      amlCase: { update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    mockPrisma.$transaction.mockImplementationOnce(async (fn: Function) => fn(mockTx));

    const response = await PATCH(
      makeRequest({
        filingStatus: 'FILED',
        filingReference: 'STR-2026-0042',
        filedAt,
      }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filingStatus).toBe('FILED');
    expect(body.filingReference).toBe('STR-2026-0042');
    expect(mockTx.amlCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { status: 'CLOSED_STR_FILED' },
    });
  });

  it('returns 400 when FILED without filingReference', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'APPROVED_FOR_STR_FILING',
      caseNumber: 'AML-2026-001',
    });

    const response = await PATCH(
      makeRequest({
        filingStatus: 'FILED',
        filedAt: '2026-05-04T10:00:00.000Z',
      }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 when FILED without filedAt', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'APPROVED_FOR_STR_FILING',
      caseNumber: 'AML-2026-001',
    });

    const response = await PATCH(
      makeRequest({
        filingStatus: 'FILED',
        filingReference: 'STR-2026-0042',
      }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 409 when case is not in APPROVED_FOR_STR_FILING status', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'UNDER_REVIEW',
      caseNumber: 'AML-2026-001',
    });

    const response = await PATCH(
      makeRequest({ filingStatus: 'DRAFTING' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Case is not in Approved for STR Filing status');
  });

  it('returns 404 for non-existent case', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce(null);

    const response = await PATCH(
      makeRequest({ filingStatus: 'DRAFTING' }) as any,
      { params: Promise.resolve({ id: 'nonexistent' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Case not found' });
  });

  it('returns 500 when Prisma throws', async () => {
    mockPrisma.amlCase.findUnique.mockRejectedValueOnce(new Error('DB down'));

    const response = await PATCH(
      makeRequest({ filingStatus: 'DRAFTING' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to update filing status' });
  });
});
