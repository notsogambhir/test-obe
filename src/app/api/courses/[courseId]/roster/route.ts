import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

// Enhanced API for course roster management with section support
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Fetch course info for summary
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

    // Fetch enrolled students with their details
    const enrollments = await db.enrollment.findMany({
      where: {
        courseId,
      },
      include: {
        student: {
          include: {
            program: {
              select: {
                name: true,
                code: true
              }
            },
            batch: {
              select: {
                name: true,
                startYear: true,
                endYear: true
              }
            }
          }
        }
      },
      orderBy: {
        student: {
          studentId: 'asc'
        }
      }
    });

    // Calculate summary statistics
    const totalEnrolled = enrollments.length;
    const activeStudents = enrollments.filter(e => e.isActive && e.student.isActive).length;
    const inactiveStudents = totalEnrolled - activeStudents;

    // Transform data for frontend
    const roster = enrollments.map(enrollment => ({
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.createdAt.toISOString(),
      student: {
        id: enrollment.student.id,
        studentId: enrollment.student.studentId, // This is Roll No
        studentName: enrollment.student.name,
        studentRollNo: enrollment.student.studentId, // Redundant for compatibility
        studentEmail: enrollment.student.email,
        isActive: enrollment.isActive && enrollment.student.isActive,
        enrollmentDate: enrollment.createdAt.toISOString().split('T')[0], // For StudentsTab
        program: enrollment.student.program,
        batch: enrollment.student.batch
      }
    }));

    const response = {
      roster,
      summary: {
        totalEnrolled,
        activeStudents,
        inactiveStudents,
        courseInfo: {
          code: course.code,
          name: course.name,
          status: course.status,
          program: course.batch.program.name,
          batch: course.batch.name
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching course roster:', error);
    return NextResponse.json({ error: 'Failed to fetch course roster' }, { status: 500 });
  }
}

// Enhanced POST function for adding students to course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const body = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Student IDs are required' }, { status: 400 });
    }

    // Validate that all students exist
    const students = await db.student.findMany({
      where: {
        id: { in: studentIds }
      },
      select: {
        id: true,
        name: true,
        studentId: true
      }
    });

    const foundStudentIds = new Set(students.map(s => s.id));
    const invalidStudentIds = studentIds.filter(id => !foundStudentIds.has(id));

    if (invalidStudentIds.length > 0) {
      return NextResponse.json({ 
        error: `Invalid student IDs: ${invalidStudentIds.join(', ')}` 
      }, { status: 400 });
    }

    // Filter out students already enrolled in this course
    const existingEnrollments = await db.enrollment.findMany({
      where: {
        courseId,
        studentId: { in: studentIds },
        isActive: true
      },
      select: {
        studentId: true
      }
    });

    const existingStudentIds = new Set(existingEnrollments.map(e => e.studentId));
    const newStudentIds = studentIds.filter(id => !existingStudentIds.has(id));

    if (newStudentIds.length === 0) {
      return NextResponse.json({ 
        message: 'All students are already enrolled in this course',
        enrolledCount: 0
      });
    }

    try {
      // Add new students to course
      await db.enrollment.createMany({
        data: newStudentIds.map(studentId => ({
          courseId,
          studentId,
          isActive: true
        }))
      });

      return NextResponse.json({
        message: `Successfully enrolled ${newStudentIds.length} students in course`,
        enrolledCount: newStudentIds.length
      });
    } catch (error) {
      console.error('Error adding students to course:', error);
      return NextResponse.json({ error: 'Failed to enroll students' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/courses/[courseId]/roster:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}