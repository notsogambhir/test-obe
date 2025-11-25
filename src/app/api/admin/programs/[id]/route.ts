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

    const { name, code, collegeId, duration, description, isActive } = await request.json();

    if (!name || !code || !collegeId || !duration) {
      return NextResponse.json(
        { error: 'Name, code, college, and duration are required' },
        { status: 400 }
      );
    }

    // Validate duration
    if (duration < 1 || duration > 10) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 10 years' },
        { status: 400 }
      );
    }

    // Check if program exists
    const existingProgram = await db.program.findUnique({
      where: { id }
    });

    if (!existingProgram) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Check if college exists
    const college = await db.college.findUnique({
      where: { id: collegeId }
    });

    if (!college) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    // Check if another program with same name or code exists in this college
    const duplicateProgram = await db.program.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { collegeId },
          {
            OR: [
              { name: name },
              { code: code }
            ]
          }
        ]
      }
    });

    if (duplicateProgram) {
      return NextResponse.json(
        { error: 'Program with this name or code already exists in this college' },
        { status: 409 }
      );
    }

    const program = await db.program.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        collegeId,
        duration: parseInt(duration),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : existingProgram.isActive
      },
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

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error updating program:', error);
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

    // Check if program exists
    const existingProgram = await db.program.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            batches: true,
            users: true,
            students: true
          }
        }
      }
    });

    if (!existingProgram) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Check if program has associated data
    if (
      existingProgram._count.batches > 0 ||
      existingProgram._count.users > 0 ||
      existingProgram._count.students > 0
    ) {
      return NextResponse.json(
        { error: 'Cannot delete program with associated batches, users, or students' },
        { status: 400 }
      );
    }

    await db.program.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}