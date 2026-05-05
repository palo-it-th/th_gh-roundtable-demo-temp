import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => import('@/lib/__mocks__/db'));

import { prisma } from '@/lib/db';
import { POST } from './route';

const mockPrisma = prisma as unknown as {
  amlCase: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/cases/case-1/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validNoteBody = {
  noteType: 'TRANSACTION_REVIEW',
  content: 'Reviewed counterparty details and transaction patterns',
  author: 'analyst@bank.com',
};

const createdNote = {
  id: 'note-new',
  caseId: 'case-1',
  noteType: 'TRANSACTION_REVIEW',
  author: 'analyst@bank.com',
  content: 'Reviewed counterparty details and transaction patterns',
  createdAt: new Date('2026-05-04T10:00:00Z'),
};

describe('POST /api/cases/[id]/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a note and returns 201', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'UNDER_REVIEW',
      caseNumber: 'AML-2026-001',
    });
    mockPrisma.$transaction.mockImplementationOnce(async (fn: Function) => {
      const tx = {
        investigationNote: { create: vi.fn().mockResolvedValueOnce(createdNote) },
        auditLog: { create: vi.fn().mockResolvedValue({}) },
        amlCase: { update: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const response = await POST(makeRequest(validNoteBody) as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe('note-new');
    expect(body.caseId).toBe('case-1');
    expect(body.noteType).toBe('TRANSACTION_REVIEW');
    expect(body.author).toBe('analyst@bank.com');
    expect(body.createdAt).toBe('2026-05-04T10:00:00.000Z');
  });

  it('auto-transitions case from NEW to UNDER_REVIEW on first note', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce({
      id: 'case-1',
      status: 'NEW',
      caseNumber: 'AML-2026-001',
    });

    const mockTx = {
      investigationNote: { create: vi.fn().mockResolvedValueOnce(createdNote) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      amlCase: { update: vi.fn().mockResolvedValue({}) },
    };
    mockPrisma.$transaction.mockImplementationOnce(async (fn: Function) => fn(mockTx));

    const response = await POST(makeRequest(validNoteBody) as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });

    expect(response.status).toBe(201);
    expect(mockTx.amlCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { status: 'UNDER_REVIEW' },
    });
    // Two audit log entries: "Note Added" + "Status Changed"
    expect(mockTx.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it('returns 400 for empty content', async () => {
    const response = await POST(
      makeRequest({ ...validNoteBody, content: '' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for missing noteType', async () => {
    const response = await POST(
      makeRequest({ content: 'some content', author: 'analyst@bank.com' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for invalid noteType', async () => {
    const response = await POST(
      makeRequest({ ...validNoteBody, noteType: 'INVALID_TYPE' }) as any,
      { params: Promise.resolve({ id: 'case-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 404 for non-existent case', async () => {
    mockPrisma.amlCase.findUnique.mockResolvedValueOnce(null);

    const response = await POST(makeRequest(validNoteBody) as any, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Case not found' });
  });

  it('returns 500 when Prisma throws', async () => {
    mockPrisma.amlCase.findUnique.mockRejectedValueOnce(new Error('DB down'));

    const response = await POST(makeRequest(validNoteBody) as any, {
      params: Promise.resolve({ id: 'case-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to add investigation note' });
  });
});
