import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { canManageCollegeResources } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get('collegeId');

    // Check permissions
    if (collegeId && !canManageCollegeResources(user, collegeId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If user is department role, only show their college's programs
    let whereClause = collegeId ? { collegeId } : {};
    if (user.role === 'DEPARTMENT' && user.collegeId) {
      whereClause = { collegeId: user.collegeId };
    }

    const programs = await db.program.findMany({
      where: whereClause,
      include: {
        college: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            batches: true,
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform the data to include duration in the response
    const transformedPrograms = programs.map(program => ({
      ...program,
      duration: program.duration
    }));

    return NextResponse.json(transformedPrograms);
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, code, collegeId, duration, description } = await request.json();

    if (!name || !code || !collegeId || !duration) {
      return NextResponse.json(
        { error: 'Name, code, college, and duration are required' },
        { status: 400 }
      );
    }

    // Check permissions - department users can only create programs in their college
    if (!canManageCollegeResources(user, collegeId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate duration
    if (duration < 1 || duration > 10) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 10 years' },
        { status: 400 }
      );
    }

    // Check if college exists
    const college = await db.college.findUnique({
      where: { id: collegeId }
    });

    if (!college) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    // Check if program with same name or code already exists in this college
    const existingProgram = await db.program.findFirst({
      where: {
        collegeId,
        OR: [
          { name: name },
          { code: code }
        ]
      }
    });

    if (existingProgram) {
      return NextResponse.json(
        { error: 'Program with this name or code already exists in this college' },
        { status: 409 }
      );
    }

    const program = await db.program.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        collegeId,
        duration: parseInt(duration),
        description: description?.trim() || null
      },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}