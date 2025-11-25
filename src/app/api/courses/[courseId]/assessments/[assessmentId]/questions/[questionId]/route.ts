import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse, canTeacherManageCourse } from '@/lib/permissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string, assessmentId: string, questionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { courseId, assessmentId, questionId } = resolvedParams;
    const body = await request.json();
    const { question, maxMarks, coIds, isActive } = body;

    if (!courseId || !assessmentId || !questionId) {
      return NextResponse.json(
        { error: 'Course ID, Assessment ID, and Question ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Check if teacher can manage this assessment
    if (user.role === 'TEACHER') {
      const assessment = await db.assessment.findFirst({
        where: {
          id: assessmentId,
          courseId,
          isActive: true
        }
      });

      if (!assessment || !assessment.sectionId) {
        return NextResponse.json(
          { error: 'Assessment not found or not assigned to a section' },
          { status: 404 }
        );
      }
      
      const canManage = await canTeacherManageCourse(user.id, courseId, assessment.sectionId);
      if (!canManage) {
        return NextResponse.json(
          { error: 'Insufficient permissions to update questions for this assessment' },
          { status: 403 }
        );
      }
    } else if (!canCreateCourse(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update questions' },
        { status: 403 }
      );
    }

    // Validate question exists and belongs to assessment
    const existingQuestion = await db.question.findFirst({
      where: {
        id: questionId,
        assessment: {
          id: assessmentId,
          courseId
        }
      }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Validate COs if provided
    if (coIds && Array.isArray(coIds) && coIds.length > 0) {
      const cos = await db.cO.findMany({
        where: {
          id: { in: coIds },
          courseId,
          isActive: true
        }
      });

      if (cos.length !== coIds.length) {
        return NextResponse.json(
          { error: 'One or more Course Outcomes not found' },
          { status: 404 }
        );
      }
    }

    // Update question and CO mappings
    const updateData: any = {
      ...(question && { question: question.trim() }),
      ...(maxMarks && { maxMarks: parseInt(maxMarks) }),
      ...(isActive !== undefined && { isActive })
    };

    // If CO IDs are provided, update the mappings
    if (coIds && Array.isArray(coIds)) {
      // Delete existing mappings
      await db.questionCOMapping.deleteMany({
        where: { questionId }
      });

      // Create new mappings if any COs are provided
      if (coIds.length > 0) {
        updateData.coMappings = {
          create: coIds.map((coId: string) => ({
            coId,
            isActive: true
          }))
        };
      }
    }

    const updatedQuestion = await db.question.update({
      where: { id: questionId },
      data: updateData,
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
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string, assessmentId: string, questionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { courseId, assessmentId, questionId } = resolvedParams;

    if (!courseId || !assessmentId || !questionId) {
      return NextResponse.json(
        { error: 'Course ID, Assessment ID, and Question ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Check if teacher can manage this assessment
    if (user.role === 'TEACHER') {
      const assessment = await db.assessment.findFirst({
        where: {
          id: assessmentId,
          courseId,
          isActive: true
        }
      });

      if (!assessment || !assessment.sectionId) {
        return NextResponse.json(
          { error: 'Assessment not found or not assigned to a section' },
          { status: 404 }
        );
      }
      
      const canManage = await canTeacherManageCourse(user.id, courseId, assessment.sectionId);
      if (!canManage) {
        return NextResponse.json(
          { error: 'Insufficient permissions to delete questions for this assessment' },
          { status: 403 }
        );
      }
    } else if (!canCreateCourse(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete questions' },
        { status: 403 }
      );
    }

    // Validate question exists and belongs to assessment
    const existingQuestion = await db.question.findFirst({
      where: {
        id: questionId,
        assessment: {
          id: assessmentId,
          courseId
        }
      }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await db.question.update({
      where: { id: questionId },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}