import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

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

    // Get course to verify permissions and get batch info
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        batch: {
          include: {
            program: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check permissions based on user role
    const canViewSections = 
      user.role === 'ADMIN' || 
      user.role === 'UNIVERSITY' || 
      (user.role === 'DEPARTMENT' && course.batch.program.collegeId === user.collegeId) ||
      (user.role === 'PROGRAM_COORDINATOR' && course.batch.programId === user.programId) ||
      (user.role === 'TEACHER'); // Teachers can view sections to select for assessment creation

    if (!canViewSections) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get sections for this course's batch
    const sections = await db.section.findMany({
      where: {
        batchId: course.batchId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching course sections:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}