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

    const { name, code, description, isActive } = await request.json();

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if college exists
    const existingCollege = await db.college.findUnique({
      where: { id }
    });

    if (!existingCollege) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    // Check if another college with same name or code exists
    const duplicateCollege = await db.college.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { name: name },
              { code: code }
            ]
          }
        ]
      }
    });

    if (duplicateCollege) {
      return NextResponse.json(
        { error: 'College with this name or code already exists' },
        { status: 409 }
      );
    }

    const college = await db.college.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : existingCollege.isActive
      }
    });

    return NextResponse.json(college);
  } catch (error) {
    console.error('Error updating college:', error);
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

    // Check if college exists
    const existingCollege = await db.college.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            programs: true,
            users: true
          }
        }
      }
    });

    if (!existingCollege) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    // Check if college has associated data
    if (
      existingCollege._count.programs > 0 ||
      existingCollege._count.users > 0
    ) {
      return NextResponse.json(
        { error: 'Cannot delete college with associated programs or users' },
        { status: 400 }
      );
    }

    await db.college.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'College deleted successfully' });
  } catch (error) {
    console.error('Error deleting college:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}