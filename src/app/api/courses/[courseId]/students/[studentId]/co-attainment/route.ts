import { NextRequest, NextResponse } from 'next/server';
import { COAttainmentService } from '../../../../../../../lib/co-attainment';
import { getUserFromRequest } from '../../../../../../../lib/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string, studentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { courseId, studentId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    
    const academicYear = searchParams.get('academicYear') || undefined;
    const semester = searchParams.get('semester') || undefined;
    const coId = searchParams.get('coId') || undefined;

    if (!courseId || !studentId) {
      return NextResponse.json(
        { error: 'Course ID and Student ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Check if user can access this data (own data as student, or teacher/admin)
    const canAccess = user.role === 'ADMIN' || 
                     user.role === 'UNIVERSITY' || 
                     user.role === 'DEPARTMENT' || 
                     user.role === 'PROGRAM_COORDINATOR' || 
                     user.role === 'TEACHER' || 
                     (user.role === 'STUDENT' && user.id === studentId);

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view student attainment' },
        { status: 403 }
      );
    }

    let result;
    if (coId) {
      // Calculate attainment for specific CO
      result = await COAttainmentService.calculateStudentCOAttainment(
        studentId,
        coId,
        academicYear
      );
    } else {
      // Get all CO attainments for this student in the course
      const courseAttainment = await COAttainmentService.calculateCourseCOAttainment(
        courseId,
        academicYear
      );
      
      result = courseAttainment.studentAttainments.filter(
        sa => sa.studentId === studentId
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student CO attainment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student CO attainment data' },
      { status: 500 }
    );
  }
}