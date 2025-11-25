import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string, assessmentId: string, questionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { courseId, assessmentId, questionId } = resolvedParams;
    const body = await request.json();
    const { coIds } = body;

    if (!courseId || !assessmentId || !questionId || !coIds || !Array.isArray(coIds) || coIds.length === 0) {
      return NextResponse.json(
        { error: 'Course ID, Assessment ID, Question ID, and coIds array are required' },
        { status: 400 }
      );
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    if (!canCreateCourse(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update CO mappings' },
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

    // Validate COs exist and belong to course
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

    // Delete existing mappings
    await db.questionCOMapping.deleteMany({
      where: { questionId }
    });

    // Create new mappings
    await db.questionCOMapping.createMany({
      data: coIds.map((coId: string) => ({
        questionId,
        coId,
        isActive: true
      }))
    });

    // Fetch updated question with CO mappings
    const updatedQuestion = await db.question.findUnique({
      where: { id: questionId },
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
    console.error('Error updating CO mappings:', error);
    return NextResponse.json(
      { error: 'Failed to update CO mappings' },
      { status: 500 }
    );
  }
}