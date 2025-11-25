import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromRequest } from '@/lib/auth';

// GET /api/courses/[courseId]/teacher-assignments - Get teacher assignments for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { courseId } = await params;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check permissions - Admin, University, Program Coordinator, and Teachers can view their own assignments
    if (!['ADMIN', 'UNIVERSITY', 'PROGRAM_COORDINATOR', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the course to verify permissions
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        batch: {
          include: {
            program: {
              include: {
                college: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // For Program Coordinator role, check if they have access to this course
    if (user.role === 'PROGRAM_COORDINATOR') {
      if (course.batch.programId !== user.programId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

      // Get all teacher assignments for this course
    let assignments = await db.teacherAssignment.findMany({
      where: {
        courseId,
        isActive: true
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        section: {
          include: {
            batch: {
              include: {
                program: true
              }
            }
          }
        },
        course: {
          include: {
            batch: {
              include: {
                program: true
              }
            }
          }
        }
      },
      orderBy: [
        { section: { name: 'asc' } },
        { teacher: { name: 'asc' } }
      ]
    });

    // If user is a teacher, filter to show only their assignments
    if (user.role === 'TEACHER') {
      assignments = assignments.filter(assignment => assignment.teacherId === user.id);
    }

    // Get available teachers for assignment
    let availableTeachersQuery: any = {
      where: {
        role: 'TEACHER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        collegeId: true
      },
      orderBy: {
        name: 'asc'
      }
    };

    // If user is Department role, filter by their college
    if (user.role === 'DEPARTMENT' && user.collegeId) {
      availableTeachersQuery.where.collegeId = user.collegeId;
    } else if (user.role === 'TEACHER' && user.collegeId) {
      // For teachers, show teachers from their college
      availableTeachersQuery.where.collegeId = user.collegeId;
    } else if (user.role === 'PROGRAM_COORDINATOR' && user.programId) {
      // For program coordinators, show teachers from their program's college
      const program = await db.program.findUnique({
        where: { id: user.programId },
        select: { collegeId: true }
      });
      if (program) {
        availableTeachersQuery.where.collegeId = program.collegeId;
      }
    }

    const availableTeachers = await db.user.findMany(availableTeachersQuery);

    // Get all sections for this course
    const sections = await db.section.findMany({
      where: {
        batchId: course.batchId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Find course-level default teacher
    const courseLevelAssignment = assignments.find(a => a.sectionId === null);

    return NextResponse.json({
      course,
      assignments,
      courseLevelAssignment,
      availableTeachers,
      sections,
      batchInfo: {
        batchId: course.batch.id,
        batchName: course.batch.name,
        programId: course.batch.program.id,
        programName: course.batch.program.name
      }
    });
  } catch (error) {
    console.error('Teacher assignments GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/teacher-assignments - Save teacher assignments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { mode, courseLevelTeacherId, sectionAssignments } = await request.json();

    if (!mode || !['single', 'section'].includes(mode)) {
      return NextResponse.json({ error: 'Valid mode is required (single or section)' }, { status: 400 });
    }

    const { courseId } = await params;

    // Check permissions - Admin, University, and Program Coordinator can assign teachers
    if (!['ADMIN', 'UNIVERSITY', 'PROGRAM_COORDINATOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the course to verify permissions
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        batch: {
          include: {
            program: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // For Program Coordinator role, check if they have access to this course
    if (user.role === 'PROGRAM_COORDINATOR') {
      if (course.batch.programId !== user.programId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Use a transaction to ensure atomic updates
    await db.$transaction(async (tx) => {
      // Delete all existing assignments for this course
      await tx.teacherAssignment.deleteMany({
        where: { courseId }
      });

      if (mode === 'single' && courseLevelTeacherId) {
        // Create course-level assignment
        await tx.teacherAssignment.create({
          data: {
            courseId,
            teacherId: courseLevelTeacherId,
            sectionId: null // Course-level assignment
          }
        });
      } else if (mode === 'section' && sectionAssignments) {
        // Create section-level assignments
        for (const [sectionId, teacherId] of Object.entries(sectionAssignments as Record<string, string>)) {
          if (teacherId && sectionId && sectionId.trim() !== '') { // Only create if teacher is selected and sectionId is not empty
            await tx.teacherAssignment.create({
              data: {
                courseId,
                sectionId: sectionId.trim(),
                teacherId
              }
            });
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Teacher assignments saved successfully',
      mode
    });
  } catch (error) {
    console.error('Teacher assignments POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}