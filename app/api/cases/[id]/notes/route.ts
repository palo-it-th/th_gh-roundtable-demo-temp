import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { addNoteSchema } from '@/lib/validations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const body = await request.json();
    const parsed = addNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const amlCase = await prisma.amlCase.findUnique({
      where: { id },
      select: { id: true, status: true, caseNumber: true },
    });

    if (!amlCase) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const { noteType, content, author } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const note = await tx.investigationNote.create({
        data: {
          caseId: id,
          noteType,
          content,
          author,
        },
      });

      await tx.auditLog.create({
        data: {
          caseId: id,
          actor: author,
          action: 'Note Added',
          details: `Added ${noteType} note`,
        },
      });

      if (amlCase.status === 'NEW') {
        await tx.amlCase.update({
          where: { id },
          data: { status: 'UNDER_REVIEW' },
        });

        await tx.auditLog.create({
          data: {
            caseId: id,
            actor: 'System',
            action: 'Status Changed',
            details: 'Status auto-transitioned from NEW to UNDER_REVIEW',
          },
        });
      }

      return note;
    });

    return NextResponse.json(
      {
        id: result.id,
        caseId: result.caseId,
        noteType: result.noteType,
        author: result.author,
        content: result.content,
        createdAt: result.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add note error:', error);
    return NextResponse.json(
      { error: 'Failed to add investigation note' },
      { status: 500 }
    );
  }
}
