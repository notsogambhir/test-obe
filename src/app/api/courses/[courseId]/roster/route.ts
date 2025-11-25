import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

// Placeholder API for course roster management
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
        courseId: courseId,
        isActive: true
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true
          }
        }
      },
      orderBy: {
        student: {
          studentId: 'asc'
        }
      }
    });

    // Transform the data for the frontend
    const roster = enrollments.map(enrollment => ({
      id: enrollment.id,
      studentId: enrollment.student.id,
      studentName: enrollment.student.name,
      studentRollNo: enrollment.student.studentId,
      studentEmail: enrollment.student.email,
      enrollmentDate: enrollment.createdAt
    }));

    return NextResponse.json(roster);
  } catch (error) {
    console.error('Error fetching course roster:', error);
    return NextResponse.json({ error: 'Failed to fetch course roster' }, { status: 500 });
  }
}

// Placeholder for adding students to course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const body = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Student IDs are required' }, { status: 400 });
    }

    // Placeholder implementation
    return NextResponse.json({ 
      message: 'PLACEHOLDER: Student enrollment functionality',
      enrolledStudents: studentIds.length 
    }, { status: 200 });
  } catch (error) {
    console.error('Error enrolling students:', error);
    return NextResponse.json({ error: 'Failed to enroll students' }, { status: 500 });
  }
}