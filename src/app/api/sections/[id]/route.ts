import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// DELETE /api/sections/[id] - Delete a section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: sectionId } = await params;

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    // Check permissions - Admin, University, and Department can delete sections
    if (!['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the section with batch info to check permissions
    const section = await db.section.findUnique({
      where: { id: sectionId },
      include: {
        batch: {
          include: {
            program: {
              include: {
                college: true
              }
            }
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // For Department role, check if they have access to this batch
    if (user.role === 'DEPARTMENT') {
      if (section.batch.program.collegeId !== user.collegeId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Check if section has students
    if (section._count.students > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete section with assigned students',
        message: `This section has ${section._count.students} student(s). Please reassign them first.`
      }, { status: 400 });
    }

    // Delete the section (this will set sectionId to null for all students due to foreign key constraints)
    await db.section.delete({
      where: { id: sectionId }
    });

    return NextResponse.json({ 
      message: 'Section deleted successfully',
      sectionName: section.name
    });
  } catch (error) {
    console.error('Section DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}