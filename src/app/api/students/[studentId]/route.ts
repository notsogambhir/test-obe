import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

// Helper function to get token from both headers and cookies
function getTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first (for cross-origin requests)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Fall back to cookie (for same-origin requests)
  return request.cookies.get('auth-token')?.value || null;
}

const updateStudentSchema = z.object({
  name: z.string().min(1, 'Student name is required').optional(),
  programId: z.string().min(1, 'Program is required').optional(),
  batchId: z.string().min(1, 'Batch is required').optional(),
  isActive: z.boolean().optional(),
});

// GET /api/students/[studentId] - Get a specific student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    // Get token using enhanced function (supports both header and cookie)
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { studentId } = await params;

    // Add null check for studentId
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const student = await db.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
      include: {
        batch: {
          include: {
            program: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        program: {
          select: {
            name: true,
            code: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            batch: {
              select: {
                name: true,
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

// PUT /api/students/[studentId] - Update a student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    // Get token using enhanced function (supports both header and cookie)
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Only department, program coordinator, university, and admin roles can update students
    if (!['DEPARTMENT', 'PROGRAM_COORDINATOR', 'UNIVERSITY', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { studentId } = await params;
    const body = await request.json();
    const validatedData = updateStudentSchema.parse(body);

    // Check if student exists
    const existingStudent = await db.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // If batchId is being updated, check if batch exists
    if (validatedData.batchId && validatedData.batchId !== existingStudent.batchId) {
      const batch = await db.batch.findUnique({
        where: { id: validatedData.batchId },
      });

      if (!batch) {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }
    }

    // Update the student
    const updatedStudent = await db.user.update({
      where: { id: studentId },
      data: {
        ...(validatedData.name && { name: validatedData.name.trim() }),
        ...(validatedData.programId && { programId: validatedData.programId }),
        ...(validatedData.batchId && { batchId: validatedData.batchId }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
      include: {
        batch: {
          include: {
            program: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        program: {
          select: {
            name: true,
            code: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            batch: {
              select: {
                name: true,
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[studentId] - Delete a student (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    // Get token using enhanced function (supports both header and cookie)
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Only department, program coordinator, university, and admin roles can delete students
    if (!['DEPARTMENT', 'PROGRAM_COORDINATOR', 'UNIVERSITY', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { studentId } = await params;

    // Check if student exists
    const existingStudent = await db.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await db.user.update({
      where: { id: studentId },
      data: { isActive: false },
    });

    return NextResponse.json(
      { message: 'Student deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}