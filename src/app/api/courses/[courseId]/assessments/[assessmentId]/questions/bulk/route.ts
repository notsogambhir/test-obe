import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canManageCourse } from '@/lib/permissions';

interface BulkQuestionsRequest {
  questions: Array<{
    question: string;
    maxMarks: number;
    coCodes: string | string[];
  }>;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string; assessmentId: string; }> }
) {
  try {
    const resolvedParams = await context.params;
    const { courseId, assessmentId } = resolvedParams;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Check if user can manage this course
    console.log('=== Bulk Questions Upload Debug ===');
    console.log('User role:', user?.role);
    console.log('Can manage course check result:', canManageCourse(user));
    console.log('User ID:', user?.id);
    console.log('Course ID:', courseId);
    console.log('Assessment ID:', assessmentId);
    
    if (!canManageCourse(user)) {
      console.log('Permission check failed - returning 403');
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin, university, department, and program coordinator roles can manage assessments.' 
      }, { status: 403 });
    }

    const body: BulkQuestionsRequest = await request.json();
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json({ error: 'Invalid questions data' }, { status: 400 });
    }

    // Get COs for this course to map CO codes to IDs
    const courseCOs = await db.cO.findMany({
      where: {
        courseId: courseId,
        isActive: true
      }
    });

    const coCodeToIdMap = new Map();
    courseCOs.forEach(co => {
      coCodeToIdMap.set(co.code.toLowerCase(), co.id);
    });

    // Process each question
    const createdQuestions: any[] = [];
    for (const questionData of body.questions) {
      const { question, maxMarks, coCodes } = questionData;
      
      if (!question || !maxMarks) {
        continue; // Skip invalid questions
      }
      
      // Map CO codes to IDs
      const coIds: string[] = [];
      if (Array.isArray(coCodes)) {
        for (const code of coCodes) {
          const coId = coCodeToIdMap.get(code.toLowerCase().trim());
          if (coId) {
            coIds.push(coId);
          }
        }
      }

      // Create question
      const createdQuestion = await db.question.create({
        data: {
          assessmentId: assessmentId,
          question: question.trim(),
          maxMarks: typeof maxMarks === 'string' ? parseInt(maxMarks) : maxMarks || 10,
          isActive: true
        }
      });

      // Create CO mappings
      if (coIds.length > 0) {
        await Promise.all(
          coIds.map(coId =>
            db.questionCOMapping.create({
              data: {
                questionId: createdQuestion.id,
                coId,
                isActive: true
              }
            })
          )
        );
      }

      createdQuestions.push(createdQuestion);
    }

    return NextResponse.json({
      message: `Successfully created ${createdQuestions.length} questions`,
      questions: createdQuestions
    });
  } catch (error) {
    console.error('Error creating bulk questions:', error);
    return NextResponse.json(
      { error: 'Failed to create questions' },
      { status: 500 }
    );
  }
}