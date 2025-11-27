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
        { error: 'Insufficient permissions to check marks status' },
        { status: 403 }
      );
    }

    // Get total questions for this assessment
    const totalQuestions = assessment.questions.length;
    
    if (totalQuestions === 0) {
      return NextResponse.json({
        hasMarks: false,
        totalQuestions: 0,
        questionsWithMarks: 0,
        percentage: 0
      });
    }

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
      distinct: ['questionId']
    });

    // Count unique questions with marks
    const questionsWithMarks = studentMarks.length;
    const percentage = totalQuestions > 0 ? (questionsWithMarks / totalQuestions) * 100 : 0;
    const hasMarks = questionsWithMarks > 0;

    return NextResponse.json({
      hasMarks,
      totalQuestions,
      questionsWithMarks,
      percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
    });

  } catch (error) {
    console.error('Error checking marks upload status:', error);
    return NextResponse.json(
      { error: 'Failed to check marks upload status' },
      { status: 500 }
    );
  }
}