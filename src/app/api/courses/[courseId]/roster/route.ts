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

    // Fetch enrolled students with their details
    const enrollments = await db.enrollment.findMany({
      where: {
        courseId,
        isActive: true
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true
          }
        }
      },
      orderBy: {
        student: {
          studentId: 'asc'
        }
      }
    });

    // Transform data for frontend
    const roster = enrollments.map(enrollment => ({
      id: enrollment.id,
      studentId: enrollment.student.id,
      studentName: enrollment.student.name,
      studentRollNo: enrollment.student.studentId,
      studentEmail: enrollment.student.email,
      sectionId: null, // Will be populated from section assignments
      sectionName: 'Unassigned', // Will be populated from section assignments
      enrollmentDate: enrollment.createdAt.toISOString().split('T')[0]
    }));

    return NextResponse.json(roster);
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

    // Validate that all students exist and are enrolled in the course
    const students = await db.user.findMany({
      where: {
        id: { in: studentIds },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true
      }
    });

    const invalidStudentIds = studentIds.filter(id => 
      !students.some(student => student.id === id)
    );

    if (invalidStudentIds.length > 0) {
      return NextResponse.json({ 
        error: `Invalid student IDs: ${invalidStudentIds.join(', ')}` 
      }, { status: 400 });
    }

    // Check if all students are enrolled in the course
    const courseStudents = await db.enrollment.findMany({
      where: {
        courseId,
        studentId: { in: studentIds },
        isActive: true
      }
    });

    const enrolledStudentIds = new Set(courseStudents.map(s => s.studentId));

    if (enrolledStudentIds.size !== studentIds.length) {
      const unenrolledStudentIds = studentIds.filter(id => !enrolledStudentIds.has(id));
      return NextResponse.json({ 
        error: `Students not enrolled in course: ${unenrolledStudentIds.join(', ')}` 
      }, { status: 400 });
    }

    try {
      // Add students to course
      await db.enrollment.createMany({
        data: studentIds.map(studentId => ({
          courseId,
          studentId,
          isActive: true
          // Note: Section assignment should be handled separately
        }))
      });

      return NextResponse.json({
        message: `Successfully enrolled ${studentIds.length} students in course`,
        enrolledCount: studentIds.length
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