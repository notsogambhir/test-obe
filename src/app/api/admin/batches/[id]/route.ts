import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { programId, startYear, endYear, isActive } = await request.json();

    if (!programId || !startYear || !endYear) {
      return NextResponse.json(
        { error: 'Program, start year, and end year are required' },
        { status: 400 }
      );
    }

    // Validate years
    const currentYear = new Date().getFullYear();
    const startYearNum = parseInt(startYear);
    const endYearNum = parseInt(endYear);

    if (startYearNum < currentYear - 10 || startYearNum > currentYear + 10) {
      return NextResponse.json(
        { error: 'Start year must be within reasonable range' },
        { status: 400 }
      );
    }

    if (endYearNum <= startYearNum) {
      return NextResponse.json(
        { error: 'End year must be after start year' },
        { status: 400 }
      );
    }

    if (endYearNum - startYearNum > 10) {
      return NextResponse.json(
        { error: 'Program duration cannot exceed 10 years' },
        { status: 400 }
      );
    }

    // Check if batch exists
    const existingBatch = await db.batch.findUnique({
      where: { id }
    });

    if (!existingBatch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if program exists
    const program = await db.program.findUnique({
      where: { id: programId },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Auto-generate batch name based on years
    const generatedName = `${startYearNum}-${endYearNum}`;

    // Check if another batch with same name already exists in this program
    const duplicateBatch = await db.batch.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { programId },
          { name: generatedName }
        ]
      }
    });

    if (duplicateBatch) {
      return NextResponse.json(
        { error: 'Batch for this academic period already exists in this program' },
        { status: 409 }
      );
    }

    const batch = await db.batch.update({
      where: { id },
      data: {
        name: generatedName,
        programId,
        startYear: startYearNum,
        endYear: endYearNum,
        isActive: isActive !== undefined ? isActive : existingBatch.isActive
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            code: true,
            college: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if batch exists
    const existingBatch = await db.batch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courses: true,
            students: true
          }
        }
      }
    });

    if (!existingBatch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if batch has associated data
    if (
      existingBatch._count.courses > 0 ||
      existingBatch._count.students > 0
    ) {
      return NextResponse.json(
        { error: 'Cannot delete batch with associated courses or students' },
        { status: 400 }
      );
    }

    await db.batch.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}