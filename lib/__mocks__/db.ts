import { vi } from 'vitest';

export const prisma = {
  amlCase: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  investigationNote: {
    create: vi.fn(),
  },
  strDecision: {
    upsert: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
};
