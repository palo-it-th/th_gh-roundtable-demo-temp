import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => import('@/lib/__mocks__/db'));

import { prisma } from '@/lib/db';
import { POST, PATCH } from './route';

const mockPrisma = prisma as unknown as {
  amlCase: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/cases/case-1/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validDecisionBody = {
  suspicionEstablished: true,
  suspicionReason: 'Multiple high-value transfers to shell companies',
  analystRecommendation: 'File STR with AMLO',
};

const createdDecision = {
  id: 'dec-new',
  caseId: 'case-1',
  suspicionEstablished: true,
  suspicionReason: 'Multiple high-value transfers to shell companies',
  analystRecommendation: 'File STR with AMLO',
  filingStatus: 'NOT_STARTED',
};

describe('POST /api/cases/[id]/decision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates decision with suspicion established and returns 201', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'UNDER_REVIEW',
      caseNumber: 'AML-2026-001',
    });
    mockPrisma.$transaction.mockImplementationOnce(async (fn: Function) => {
      const tx = {
        strDecision: { upsert: vi.fn().mockResolvedValueOnce(createdDecision) },
        amlCase: { update: vi.fn().mockResolvedValue({}) },
        auditLog: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const response = await POST(makeRequest(validDecisionBody) as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe('dec-new');
    expect(body.suspicionEstablished).toBe(true);
    expect(body.filingStatus).toBe('NOT_STARTED');
  });

  it('creates decision with no suspicion and returns 201', async () => {
    const noSuspicionDecision = {
      ...createdDecision,
      suspicionEstablished: false,
      suspicionReason: 'Transaction patterns explained by business activity',
      analystRecommendation: 'Close case — no STR required',
    };

    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'UNDER_REVIEW',
      caseNumber: 'AML-2026-001',
    });

    const mockTx = {
      strDecision: { upsert: vi.fn().mockResolvedValueOnce(noSuspicionDecision) },
      amlCase: { update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    mockPrisma.$transaction.mockImplementationOnce(async (fn: Function) => fn(mockTx));

    const response = await POST(
      makeRequest({
        suspicionEstablished: false,
        suspicionReason: 'Transaction patterns explained by business activity',
        analystRecommendation: 'Close case — no STR required',
      }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.suspicionEstablished).toBe(false);
    // Status should be updated to CLOSED_NO_STR
    expect(mockTx.amlCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { status: 'CLOSED_NO_STR' },
    });
  });

  it('accepts case in PENDING_INFORMATION status', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'PENDING_INFORMATION',
      caseNumber: 'AML-2026-001',
    });
    mockPrisma.$transaction.mockImplementationOnce(async (fn: Function) => {
      const tx = {
        strDecision: { upsert: vi.fn().mockResolvedValueOnce(createdDecision) },
        amlCase: { update: vi.fn().mockResolvedValue({}) },
        auditLog: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const response = await POST(makeRequest(validDecisionBody) as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });

    expect(response.status).toBe(201);
  });

  it('returns 400 for empty suspicionReason', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'UNDER_REVIEW',
      caseNumber: 'AML-2026-001',
    });

    const response = await POST(
      makeRequest({ ...validDecisionBody, suspicionReason: '' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for missing suspicionEstablished', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'UNDER_REVIEW',
      caseNumber: 'AML-2026-001',
    });

    const response = await POST(
      makeRequest({
        suspicionReason: 'reason',
        analystRecommendation: 'rec',
      }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 404 for non-existent case', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce(null);

    const response = await POST(makeRequest(validDecisionBody) as any, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Case not found' });
  });

  it('returns 409 when case is in NEW status', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'NEW',
      caseNumber: 'AML-2026-001',
    });

    const response = await POST(makeRequest(validDecisionBody) as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe(
      'Case is not in a valid status for recommendation submission'
    );
  });

  it('returns 409 when case is in CLOSED_NO_STR status', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'CLOSED_NO_STR',
      caseNumber: 'AML-2026-001',
    });

    const response = await POST(makeRequest(validDecisionBody) as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
  });

  it('returns 500 when Prisma throws', async () => {
    mockPrisma.amlCase.findUnique.mockRejectedValueOnce(new Error('DB down'));

    const response = await POST(makeRequest(validDecisionBody) as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to submit recommendation' });
  });
});

// ─── PATCH /api/cases/[id]/decision ──────────────────────

function makePatchRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/cases/case-1/decision', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/cases/[id]/decision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('approves case and changes status to APPROVED_FOR_STR_FILING', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'PENDING_REVIEWER_APPROVAL',
      caseNumber: 'AML-2026-001',
    });

    const updatedDecision = {
      id: 'dec-1',
      caseId: 'case-1',
      reviewerDecision: 'approved',
      reviewerComment: null,
      filingStatus: 'NOT_STARTED',
    };

    const mockTx = {
      strDecision: { update: vi.fn().mockResolvedValueOnce(updatedDecision) },
      amlCase: { update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    mockPrisma.$transaction.mockImplementationOnce(async (fn: Function) => fn(mockTx));

    const response = await PATCH(makePatchRequest({ reviewerDecision: 'approved' }) as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviewerDecision).toBe('approved');
    expect(body.reviewerComment).toBeNull();
    expect(mockTx.amlCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { status: 'APPROVED_FOR_STR_FILING' },
    });
    expect(mockTx.strDecision.update).toHaveBeenCalledWith({
      where: { caseId: 'case-1' },
      data: {
        reviewerDecision: 'approved',
        reviewerComment: null,
        filingStatus: 'NOT_STARTED',
      },
    });
  });

  it('returns case with comment and changes status to PENDING_INFORMATION', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'PENDING_REVIEWER_APPROVAL',
      caseNumber: 'AML-2026-001',
    });

    const updatedDecision = {
      id: 'dec-1',
      caseId: 'case-1',
      reviewerDecision: 'returned',
      reviewerComment: 'Need more transaction analysis',
    };

    const mockTx = {
      strDecision: { update: vi.fn().mockResolvedValueOnce(updatedDecision) },
      amlCase: { update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    mockPrisma.$transaction.mockImplementationOnce(async (fn: Function) => fn(mockTx));

    const response = await PATCH(
      makePatchRequest({
        reviewerDecision: 'returned',
        reviewerComment: 'Need more transaction analysis',
      }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviewerDecision).toBe('returned');
    expect(body.reviewerComment).toBe('Need more transaction analysis');
    expect(mockTx.amlCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { status: 'PENDING_INFORMATION' },
    });
  });

  it('returns 400 when returning without comment', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'PENDING_REVIEWER_APPROVAL',
      caseNumber: 'AML-2026-001',
    });

    const response = await PATCH(
      makePatchRequest({ reviewerDecision: 'returned' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 409 when case is not in PENDING_REVIEWER_APPROVAL status', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'UNDER_REVIEW',
      caseNumber: 'AML-2026-001',
    });

    const response = await PATCH(
      makePatchRequest({ reviewerDecision: 'approved' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Case is not in Pending Reviewer Approval status');
  });

  it('returns 404 for non-existent case', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce(null);

    const response = await PATCH(
      makePatchRequest({ reviewerDecision: 'approved' }) as any,
      { params: Promise.resolve({ id: 'nonexistent' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Case not found' });
  });

  it('returns 500 when Prisma throws', async () => {
    mockPrisma.amlCase.findUnique.mockRejectedValueOnce(new Error('DB down'));

    const response = await PATCH(
      makePatchRequest({ reviewerDecision: 'approved' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to process reviewer decision' });
  });
});
