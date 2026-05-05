import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { submitDecisionSchema, reviewerDecisionSchema } from '@/lib/validations';

const VALID_STATUSES_FOR_RECOMMENDATION = ['UNDER_REVIEW', 'PENDING_INFORMATION'] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const amlCase = await prisma.amlCase.findUnique({
      where: { id },
      select: { id: true, caseNumber: true, status: true },
    });

    if (!amlCase) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    if (
      !VALID_STATUSES_FOR_RECOMMENDATION.includes(
        amlCase.status as (typeof VALID_STATUSES_FOR_RECOMMENDATION)[number]
      )
    ) {
      return NextResponse.json(
        { error: 'Case is not in a valid status for recommendation submission' },
        { status: 409 }
      );
    }

    const body: unknown = await request.json();
    const parsed = submitDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { suspicionEstablished, suspicionReason, analystRecommendation } = parsed.data;

    const newStatus = suspicionEstablished
      ? 'PENDING_REVIEWER_APPROVAL'
      : 'CLOSED_NO_STR';

    const result = await prisma.$transaction(async (tx) => {
      const decision = await tx.strDecision.upsert({
        where: { caseId: id },
        create: {
          caseId: id,
          suspicionEstablished,
          suspicionReason,
          analystRecommendation,
        },
        update: {
          suspicionEstablished,
          suspicionReason,
          analystRecommendation,
        },
      });

      await tx.amlCase.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          caseId: id,
          actor: 'Analyst',
          action: 'Recommendation Submitted',
          details: `Suspicion ${suspicionEstablished ? 'established' : 'not established'} — status changed to ${newStatus}`,
        },
      });

      return decision;
    });

    return NextResponse.json(
      {
        id: result.id,
        caseId: result.caseId,
        suspicionEstablished: result.suspicionEstablished,
        suspicionReason: result.suspicionReason,
        analystRecommendation: result.analystRecommendation,
        filingStatus: result.filingStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Decision submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit recommendation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const amlCase = await prisma.amlCase.findUnique({
      where: { id },
      select: { id: true, caseNumber: true, status: true },
    });

    if (!amlCase) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    if (amlCase.status !== 'PENDING_REVIEWER_APPROVAL') {
      return NextResponse.json(
        { error: 'Case is not in Pending Reviewer Approval status' },
        { status: 409 }
      );
    }

    const body: unknown = await request.json();
    const parsed = reviewerDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { reviewerDecision } = parsed.data;
    const reviewerComment =
      'reviewerComment' in parsed.data ? parsed.data.reviewerComment : null;

    const newStatus =
      reviewerDecision === 'approved'
        ? 'APPROVED_FOR_STR_FILING'
        : 'PENDING_INFORMATION';

    const result = await prisma.$transaction(async (tx) => {
      const decision = await tx.strDecision.update({
        where: { caseId: id },
        data: {
          reviewerDecision,
          reviewerComment: reviewerComment ?? null,
          ...(reviewerDecision === 'approved'
            ? { filingStatus: 'NOT_STARTED' }
            : {}),
        },
      });

      await tx.amlCase.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          caseId: id,
          actor: 'Reviewer',
          action: 'Reviewer Decision',
          details: `Decision: ${reviewerDecision}${reviewerComment ? ` — Comment: ${reviewerComment}` : ''} — status changed to ${newStatus}`,
        },
      });

      return decision;
    });

    return NextResponse.json(
      {
        id: result.id,
        caseId: result.caseId,
        reviewerDecision: result.reviewerDecision,
        reviewerComment: result.reviewerComment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reviewer decision error:', error);
    return NextResponse.json(
      { error: 'Failed to process reviewer decision' },
      { status: 500 }
    );
  }
}
