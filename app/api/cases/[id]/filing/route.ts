import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateFilingSchema } from '@/lib/validations';

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

    if (amlCase.status !== 'APPROVED_FOR_STR_FILING') {
      return NextResponse.json(
        { error: 'Case is not in Approved for STR Filing status' },
        { status: 409 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateFilingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { filingStatus } = parsed.data;
    const filingReference =
      'filingReference' in parsed.data ? parsed.data.filingReference : null;
    const filedAt =
      'filedAt' in parsed.data ? parsed.data.filedAt : null;

    const newCaseStatus =
      filingStatus === 'FILED' ? 'CLOSED_STR_FILED' : undefined;

    const result = await prisma.$transaction(async (tx) => {
      const decision = await tx.strDecision.update({
        where: { caseId: id },
        data: {
          filingStatus,
          filingReference: filingReference ?? null,
          filedAt: filedAt ? new Date(filedAt) : null,
        },
      });

      if (newCaseStatus) {
        await tx.amlCase.update({
          where: { id },
          data: { status: newCaseStatus },
        });
      }

      await tx.auditLog.create({
        data: {
          caseId: id,
          actor: 'Reviewer',
          action: 'Filing Status Updated',
          details: `Filing status changed to ${filingStatus}${filingReference ? ` — Reference: ${filingReference}` : ''}`,
        },
      });

      return decision;
    });

    return NextResponse.json(
      {
        id: result.id,
        caseId: result.caseId,
        filingStatus: result.filingStatus,
        filingReference: result.filingReference,
        filedAt: result.filedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Filing status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update filing status' },
      { status: 500 }
    );
  }
}
