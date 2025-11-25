import { NextRequest, NextResponse } from 'next/server';
import { COAttainmentCalculator } from '@/lib/co-attainment-calculator';
import { getUserFromRequest } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; coId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { courseId, coId } = resolvedParams;

    if (!courseId || !coId) {
      return NextResponse.json({ error: 'Course ID and CO ID are required' }, { status: 400 });
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const academicYear = searchParams.get('academicYear') || undefined;
    const semester = searchParams.get('semester') || undefined;

    if (studentId) {
      // Get attainment for a specific student
      const attainment = await COAttainmentCalculator.calculateStudentCOAttainment(
        courseId,
        coId,
        studentId
      );

      if (!attainment) {
        return NextResponse.json(
          { error: 'No attainment data found for this student and CO' },
          { status: 404 }
        );
      }

      const attainmentWithTarget = await COAttainmentCalculator.determineTargetMet(
        courseId,
        attainment
      );

      return NextResponse.json(attainmentWithTarget);
    } else {
      // Get class-level attainment for this CO
      const classAttainment = await COAttainmentCalculator.calculateClassCOAttainment(
        courseId,
        coId,
        { academicYear }
      );

      if (!classAttainment) {
        return NextResponse.json(
          { error: 'No attainment data found for this CO' },
          { status: 404 }
        );
      }

      return NextResponse.json(classAttainment);
    }
  } catch (error) {
    console.error('Error fetching CO attainment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CO attainment' },
      { status: 500 }
    );
  }
}