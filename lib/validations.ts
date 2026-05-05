import { z } from 'zod';

export const CaseStatusEnum = z.enum([
  'NEW',
  'UNDER_REVIEW',
  'PENDING_INFORMATION',
  'PENDING_REVIEWER_APPROVAL',
  'APPROVED_FOR_STR_FILING',
  'CLOSED_NO_STR',
  'CLOSED_STR_FILED',
]);

export const RiskRatingEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const NoteTypeEnum = z.enum([
  'CUSTOMER_PROFILE_REVIEW',
  'TRANSACTION_REVIEW',
  'COUNTERPARTY_REVIEW',
  'CUSTOMER_OUTREACH',
  'DECISION_RATIONALE',
]);

export const caseListQuerySchema = z.object({
  search: z.string().optional(),
  status: CaseStatusEnum.optional(),
  riskRating: RiskRatingEnum.optional(),
  sortBy: z.enum(['riskScore', 'updatedAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CaseListQuery = z.infer<typeof caseListQuerySchema>;

export const addNoteSchema = z.object({
  noteType: NoteTypeEnum,
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const submitDecisionSchema = z.object({
  suspicionEstablished: z.boolean(),
  suspicionReason: z.string().min(1, 'Suspicion reason is required'),
  analystRecommendation: z.string().min(1, 'Analyst recommendation is required'),
});

export type SubmitDecisionInput = z.infer<typeof submitDecisionSchema>;

export const reviewerDecisionSchema = z.discriminatedUnion('reviewerDecision', [
  z.object({
    reviewerDecision: z.literal('approved'),
  }),
  z.object({
    reviewerDecision: z.literal('returned'),
    reviewerComment: z.string().min(1, 'Comment is required when returning a case'),
  }),
]);

export type ReviewerDecisionInput = z.infer<typeof reviewerDecisionSchema>;

export const FilingStatusEnum = z.enum([
  'NOT_STARTED',
  'DRAFTING',
  'READY_FOR_FILING',
  'FILED',
]);

export const updateFilingSchema = z.discriminatedUnion('filingStatus', [
  z.object({
    filingStatus: z.literal('DRAFTING'),
  }),
  z.object({
    filingStatus: z.literal('READY_FOR_FILING'),
  }),
  z.object({
    filingStatus: z.literal('FILED'),
    filingReference: z.string().min(1, 'Filing reference is required'),
    filedAt: z.string().min(1, 'Filing date is required'),
  }),
]);

export type UpdateFilingInput = z.infer<typeof updateFilingSchema>;
