import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';

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

    // Fetch COs for the course
    const cos = await db.cO.findMany({
      where: {
        courseId: courseId,
        isActive: true
      },
      orderBy: {
        code: 'asc'
      }
    });

    return NextResponse.json(cos);
  } catch (error) {
    console.error('Error fetching COs:', error);
    return NextResponse.json({ error: 'Failed to fetch COs' }, { status: 500 });
  }
}

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

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    if (!canCreateCourse(user)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin, university, department, and program coordinator roles can manage COs.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { description } = body;

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'CO description is required' }, { status: 400 });
    }

    // Get the course to verify permissions
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

    // Check permissions for program coordinators
    if (user.role === 'PROGRAM_COORDINATOR' && course.batch.programId !== user.programId) {
      return NextResponse.json({ 
        error: 'You can only manage COs for courses in your assigned program' 
      }, { status: 403 });
    }

    // Get the next CO code
    const existingCOs = await db.cO.findMany({
      where: { courseId: courseId },
      orderBy: { code: 'desc' }
    });

    const lastCOCode = existingCOs[0]?.code || 'CO0';
    const lastNumber = parseInt(lastCOCode.replace('CO', '')) || 0;
    const newCOCode = `CO${lastNumber + 1}`;

      // Create new CO
    const newCO = await db.cO.create({
      data: {
        courseId: courseId,
        code: newCOCode,
        description: description.trim(),
        isActive: true
      }
    });

    console.log(`Created CO ${newCOCode} for course ${courseId}`);

    // Emit course event to notify other components
    // Note: In a real-time system, you might use WebSockets or Server-Sent Events
    // For now, clients will need to refresh or the event system will handle intra-page updates

    return NextResponse.json(newCO, { status: 201 });
  } catch (error) {
    console.error('Error creating CO:', error);
    return NextResponse.json({ error: 'Failed to create CO' }, { status: 500 });
  }
}