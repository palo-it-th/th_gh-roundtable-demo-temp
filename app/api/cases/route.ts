import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { caseListQuerySchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = caseListQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { search, status, riskRating, sortBy, sortOrder } = parsed.data;

    const where: Prisma.AmlCaseWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search && riskRating) {
      where.AND = [
        { customer: { riskRating } },
        {
          OR: [
            { caseNumber: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    } else if (search) {
      where.OR = [
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    } else if (riskRating) {
      where.customer = { riskRating };
    }

    const orderBy: Prisma.AmlCaseOrderByWithRelationInput =
      sortBy === 'riskScore'
        ? { riskScore: sortOrder }
        : { updatedAt: sortOrder };

    const cases = await prisma.amlCase.findMany({
      where,
      orderBy,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            type: true,
            riskRating: true,
          },
        },
      },
    });

    return NextResponse.json({
      cases: cases.map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        customer: c.customer,
        alertType: c.alertType,
        riskScore: c.riskScore,
        totalAmount: c.totalAmount,
        status: c.status,
        assignedAnalyst: c.assignedAnalyst,
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Case list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}
