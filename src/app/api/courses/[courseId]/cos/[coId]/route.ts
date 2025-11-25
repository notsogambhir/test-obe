import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; coId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || !['ADMIN', 'UNIVERSITY', 'PROGRAM_COORDINATOR', 'TEACHER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Admin, University, Program Coordinator, or Teacher access required' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { courseId, coId } = resolvedParams;
    const { code, description, isActive } = await request.json();

    if (!code || !description) {
      return NextResponse.json(
        { error: 'Code and description are required' },
        { status: 400 }
      );
    }

    // Check if CO exists and get course info
    const existingCO = await db.cO.findUnique({
      where: { id: coId },
      include: {
        course: {
          include: {
            batch: {
              include: {
                program: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!existingCO || existingCO.courseId !== courseId) {
      return NextResponse.json(
        { error: 'Course Outcome not found in this course' },
        { status: 404 }
      );
    }

    // Check if user has permission for this course
    if (user.role === 'PROGRAM_COORDINATOR' && existingCO.course.batch.programId !== user.programId) {
      return NextResponse.json(
        { error: 'You can only update COs from courses in your assigned program' },
        { status: 403 }
      );
    }

    if (user.role === 'TEACHER') {
      // Teachers should only be able to update COs for courses they're assigned to
      // For now, we'll allow teachers to update any CO
      // In a real implementation, you'd check course assignments
    }

    // Check if another CO with same code exists in the same course
    const duplicateCO = await db.cO.findFirst({
      where: {
        AND: [
          { id: { not: coId } },
          { courseId: courseId },
          { code: code }
        ]
      }
    });

    if (duplicateCO) {
      return NextResponse.json(
        { error: 'Course Outcome with this code already exists in this course' },
        { status: 409 }
      );
    }

    const co = await db.cO.update({
      where: { id: coId },
      data: {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        isActive: isActive !== undefined ? isActive : existingCO.isActive
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        _count: {
          select: {
            mappings: true,
            coAttainments: true
          }
        }
      }
    });

    return NextResponse.json(co);
  } catch (error) {
    console.error('Error updating CO:', error);
    return NextResponse.json(
      { error: 'Failed to update Course Outcome' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; coId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || !['ADMIN', 'UNIVERSITY', 'PROGRAM_COORDINATOR', 'TEACHER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Admin, University, Program Coordinator, or Teacher access required' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { courseId, coId } = resolvedParams;

    // Check if CO exists and get course info
    const existingCO = await db.cO.findUnique({
      where: { id: coId },
      include: {
        course: {
          include: {
            batch: {
              include: {
                program: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            mappings: true,
            coAttainments: true
          }
        }
      }
    });

    if (!existingCO || existingCO.courseId !== courseId) {
      return NextResponse.json(
        { error: 'Course Outcome not found in this course' },
        { status: 404 }
      );
    }

    // Check if user has permission for this course
    if (user.role === 'PROGRAM_COORDINATOR' && existingCO.course.batch.programId !== user.programId) {
      return NextResponse.json(
        { error: 'You can only delete COs from courses in your assigned program' },
        { status: 403 }
      );
    }

    // Check if CO has associated data
    if (
      existingCO._count.mappings > 0 ||
      existingCO._count.coAttainments > 0
    ) {
      return NextResponse.json(
        { error: 'Cannot delete CO with associated CO-PO mappings or CO attainments' },
        { status: 400 }
      );
    }

    await db.cO.delete({
      where: { id: coId }
    });

    return NextResponse.json({ 
      message: 'Course Outcome deleted successfully',
      deletedCO: {
        code: existingCO.code,
        description: existingCO.description
      }
    });
  } catch (error) {
    console.error('Error deleting CO:', error);
    return NextResponse.json(
      { error: 'Failed to delete Course Outcome' },
      { status: 500 }
    );
  }
}