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

    // Validate assessment exists and belongs to course, include section information
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        courseId,
        isActive: true
      },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          include: {
            coMappings: {
              include: {
                co: {
                  select: {
                    id: true,
                    code: true,
                    description: true
                  }
                }
              }
            }
          }
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
        { error: 'Insufficient permissions to download template' },
        { status: 403 }
      );
    }

    // Get students enrolled in the specific section for this assessment
      // Handle both section-level and course-level assessments
    const enrollments = await db.enrollment.findMany({
      where: {
        courseId,
        isActive: true,
        ...(assessment.sectionId ? {
          student: {
            sectionId: assessment.sectionId
          }
        } : {}), // For course-level assessments, get all students in course
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

    if (enrollments.length === 0) {
      return NextResponse.json(
        { error: 'No students enrolled for this assessment' },
        { status: 404 }
      );
    }

    // Generate template data
    const templateData = {
      assessment: {
        id: assessment.id,
        name: assessment.name,
        type: assessment.type,
        maxMarks: assessment.maxMarks,
        weightage: assessment.weightage,
        section: assessment.section
      },
      questions: assessment.questions.map(q => ({
        id: q.id,
        question: q.question,
        maxMarks: q.maxMarks,
        coMappings: q.coMappings
      })),
      students: enrollments.map(e => ({
        id: e.student.id,
        name: e.student.name,
        studentId: e.student.studentId,
        email: e.student.email
      })),
      template: {
        headers: ['Student ID', 'Student Name', 'Email', ...assessment.questions.map((q, index) => `Q${index + 1} (${q.maxMarks} marks)`)],
        instructions: {
          format: 'Fill in marks for each question (0 to max marks)',
          example: {
            studentId: 'STU0001',
            studentName: 'John Doe',
            email: 'john.doe@example.com',
            marks: assessment.questions.map(() => '0') // Default 0 marks
          }
        }
      }
    };

    return NextResponse.json(templateData);
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}