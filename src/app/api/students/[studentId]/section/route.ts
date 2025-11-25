import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

// PUT /api/students/[studentId]/section - Assign student to a section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  return handleSectionUpdate(request, await params);
}

// PATCH /api/students/[studentId]/section - Update student section assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  return handleSectionUpdate(request, await params);
}

// POST /api/students/[studentId]/section - Alternative method for preview environments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  return handleSectionUpdate(request, await params);
}

// Common handler for all HTTP methods
async function handleSectionUpdate(
  request: NextRequest,
  params: { studentId: string }
) {
  const { studentId } = params;
  console.log('=== STUDENT SECTION UPDATE REQUEST START ===');
  console.log('Student ID:', studentId);
  console.log('Method:', request.method);

  try {
    // Get user using enhanced auth function (supports both header and cookie)
    const user = await getUserFromRequest(request);
    
    console.log('User from request:', { id: user?.id, role: user?.role, collegeId: user?.collegeId });

    if (!user) {
      console.log('No user found - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sectionId } = await request.json();
    console.log('Requested sectionId:', sectionId);

    if (sectionId === undefined) {
      console.log('Section ID undefined - returning 400');
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    // Fetch student details to verify existence and permissions
    const student = await db.user.findUnique({
      where: { id: studentId },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        batch: {
          include: {
            program: {
              include: {
                college: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                }
              }
            }
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can be assigned to sections' }, { status: 400 });
    }

    // Check permissions - Admin, University, and Department can assign students to sections
    console.log('=== PERMISSION CHECK ===');
    console.log('User role:', user?.role);
    console.log('User college ID:', user?.collegeId);
    console.log('Student college ID:', student?.collegeId);

    // Allow ADMIN and UNIVERSITY users directly
    if (['ADMIN', 'UNIVERSITY'].includes(user?.role)) {
      console.log('✅ Admin/University access granted');
    } else if (user?.role === 'DEPARTMENT') {
      console.log('🔍 Department access - checking college permissions');

      // Check if department user has access to this student's college
      if (student?.collegeId !== user?.collegeId) {
        console.log('❌ Department access denied - college mismatch');
        return NextResponse.json({ error: 'Access denied - insufficient college permissions' }, { status: 403 });
      }

      console.log('✅ Department access granted - college matches');
    } else {
      console.log('❌ Insufficient permissions');
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // If sectionId is not null, verify section exists and is in same batch
    if (sectionId !== null) {
      const section = await db.section.findUnique({
        where: { id: sectionId },
        include: {
          batch: {
            include: {
              program: {
                include: {
                  college: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  }
                }
              }
            }
          }
        }
      });

      if (!section) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      }

      if (section.batchId !== student.batchId) {
        return NextResponse.json({
          error: 'Section must be in the same batch as student'
        }, { status: 400 });
      }

      // Additional permission check for department users
      if (user.role === 'DEPARTMENT') {
        if (section.batch.program.collegeId !== user.collegeId) {
          return NextResponse.json({ error: 'Access denied - section belongs to different college' }, { status: 403 });
        }
      }
    }

    // Update student's section assignment
    const updatedStudent = await db.user.update({
      where: { id: studentId },
      data: { sectionId },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
          },
        },
        batch: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            }
          }
        }
      }
    });

    console.log('Student updated successfully:', updatedStudent);
    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error('=== STUDENT SECTION UPDATE ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'No message available');

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}