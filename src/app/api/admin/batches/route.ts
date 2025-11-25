import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    const batches = await db.batch.findMany({
      where: programId ? { programId } : {},
      include: {
        program: {
          select: {
            id: true,
            name: true,
            code: true,
            college: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        _count: {
          select: {
            courses: true,
            students: true
          }
        }
      },
      orderBy: [
        { startYear: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { programId, startYear, endYear } = await request.json();

    if (!programId || !startYear || !endYear) {
      return NextResponse.json(
        { error: 'Program, start year, and end year are required' },
        { status: 400 }
      );
    }

    // Validate years
    const currentYear = new Date().getFullYear();
    const startYearNum = parseInt(startYear);
    const endYearNum = parseInt(endYear);

    if (startYearNum < currentYear - 10 || startYearNum > currentYear + 10) {
      return NextResponse.json(
        { error: 'Start year must be within reasonable range' },
        { status: 400 }
      );
    }

    if (endYearNum <= startYearNum) {
      return NextResponse.json(
        { error: 'End year must be after start year' },
        { status: 400 }
      );
    }

    if (endYearNum - startYearNum > 10) {
      return NextResponse.json(
        { error: 'Program duration cannot exceed 10 years' },
        { status: 400 }
      );
    }

    // Check if program exists
    const program = await db.program.findUnique({
      where: { id: programId },
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

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Auto-generate batch name based on years
    const generatedName = `${startYearNum}-${endYearNum}`;

    // Check if batch with same name already exists in this program
    const existingBatch = await db.batch.findFirst({
      where: {
        programId,
        name: generatedName
      }
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch for this academic period already exists in this program' },
        { status: 409 }
      );
    }

    const batch = await db.batch.create({
      data: {
        name: generatedName,
        programId,
        startYear: startYearNum,
        endYear: endYearNum
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            code: true,
            college: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}