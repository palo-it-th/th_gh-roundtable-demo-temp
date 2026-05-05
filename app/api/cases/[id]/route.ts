import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const amlCase = await prisma.amlCase.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            type: true,
            riskRating: true,
            businessActivity: true,
            accountOpenDate: true,
            sourceOfWealth: true,
            nationality: true,
          },
        },
        transactions: {
          orderBy: { date: 'asc' },
          select: {
            id: true,
            direction: true,
            amount: true,
            currency: true,
            counterparty: true,
            country: true,
            date: true,
            purpose: true,
          },
        },
        notes: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            noteType: true,
            author: true,
            content: true,
            createdAt: true,
          },
        },
        decision: {
          select: {
            id: true,
            suspicionEstablished: true,
            suspicionReason: true,
            analystRecommendation: true,
            reviewerDecision: true,
            reviewerComment: true,
            filingStatus: true,
            filingReference: true,
            filedAt: true,
          },
        },
        auditLog: {
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            actor: true,
            action: true,
            details: true,
            timestamp: true,
          },
        },
      },
    });

    if (!amlCase) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: amlCase.id,
      caseNumber: amlCase.caseNumber,
      status: amlCase.status,
      riskScore: amlCase.riskScore,
      alertType: amlCase.alertType,
      alertReason: amlCase.alertReason,
      riskIndicators: amlCase.riskIndicators,
      totalAmount: amlCase.totalAmount,
      assignedAnalyst: amlCase.assignedAnalyst,
      createdAt: amlCase.createdAt.toISOString(),
      updatedAt: amlCase.updatedAt.toISOString(),
      customer: {
        ...amlCase.customer,
        accountOpenDate: amlCase.customer.accountOpenDate.toISOString(),
      },
      transactions: amlCase.transactions.map((t) => ({
        ...t,
        date: t.date.toISOString(),
      })),
      notes: amlCase.notes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      decision: amlCase.decision
        ? {
            ...amlCase.decision,
            filedAt: amlCase.decision.filedAt?.toISOString() ?? null,
          }
        : null,
      auditLog: amlCase.auditLog.map((a) => ({
        ...a,
        timestamp: a.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Case detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case details' },
      { status: 500 }
    );
  }
}
