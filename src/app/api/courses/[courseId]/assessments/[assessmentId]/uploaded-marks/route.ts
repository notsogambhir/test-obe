import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse, canTeacherManageCourse } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string, assessmentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { courseId, assessmentId } = resolvedParams;

    if (!courseId || !assessmentId) {
      return NextResponse.json(
        { error: 'Course ID and Assessment ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Validate assessment exists and get questions, include section information
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        courseId,
        isActive: true
      },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        section: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check permissions - Admin/University/Department/Program Coordinator can access all
    // Teachers can only access if they're assigned to this course/section
    let hasPermission = canCreateCourse(user);
    
    if (!hasPermission && user.role === 'TEACHER') {
      // For teachers, check if they're assigned to this course/section
      hasPermission = await canTeacherManageCourse(user.id, courseId, assessment.sectionId || undefined);
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view uploaded marks' },
        { status: 403 }
      );
    }

    // Get students enrolled in the course/section
    const enrollments = await db.enrollment.findMany({
      where: {
        courseId,
        isActive: true,
        ...(assessment.sectionId && {
          student: {
            sectionId: assessment.sectionId
          }
        })
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
          name: 'asc'
        }
      }
    });

    // Get uploaded marks for this assessment
    const academicYear = new Date().getFullYear().toString();
    const studentMarks = await db.studentMark.findMany({
      where: {
        question: {
          assessmentId: assessmentId
        },
        sectionId: assessment.sectionId || null,
        academicYear
      },
      include: {
        question: {
          select: {
            id: true,
            maxMarks: true
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true
          }
        }
      }
    });

    // Organize marks by student and question
    const marksMap: { [studentId: string]: { [questionId: string]: number | null } } = {};
    studentMarks.forEach(mark => {
      if (!marksMap[mark.studentId]) {
        marksMap[mark.studentId] = {};
      }
      marksMap[mark.studentId][mark.questionId] = mark.obtainedMarks;
    });

    // Create response data
    const responseData = enrollments.map(enrollment => {
      const student = enrollment.student;
      const questions: (number | null)[] = [];
      
      assessment.questions.forEach(question => {
        questions.push(marksMap[student.id]?.[question.id] ?? null);
      });

      return {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        questions
      };
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching uploaded marks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploaded marks' },
      { status: 500 }
    );
  }
}