import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

// GET /api/sections - Get sections for a batch
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Check permissions - Admin, University, Department, and Program Coordinator can view sections
    if (!['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // For Department role, check if they have access to this batch
    if (user.role === 'DEPARTMENT') {
      const batch = await db.batch.findUnique({
        where: { id: batchId },
        include: {
          program: {
            include: {
              college: true
            }
          }
        }
      });

      if (!batch || batch.program.collegeId !== user.collegeId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // For Program Coordinator role, check if they have access to this batch
    if (user.role === 'PROGRAM_COORDINATOR') {
      const batch = await db.batch.findUnique({
        where: { id: batchId },
        include: {
          program: true
        }
      });

      if (!batch || batch.programId !== user.programId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const sections = await db.section.findMany({
      where: {
        batchId,
        isActive: true
      },
      include: {
        batch: {
          include: {
            program: {
              include: {
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
        },
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
    console.error('Sections GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sections - Create a new section
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, batchId } = await request.json();

    if (!name || !batchId) {
      return NextResponse.json({ error: 'Name and batch ID are required' }, { status: 400 });
    }

    // Check permissions - Admin, University, and Department can create sections
    if (!['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify batch exists and check permissions
    const batch = await db.batch.findUnique({
      where: { id: batchId },
      include: {
        program: {
          include: {
            college: true
          }
        }
      }
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // For Department role, check if they have access to this batch's college
    if (user.role === 'DEPARTMENT') {
      if (batch.program.collegeId !== user.collegeId) {
        return NextResponse.json({ error: 'Access denied - insufficient college permissions' }, { status: 403 });
      }
    }

    // Check if section already exists
    const existingSection = await db.section.findFirst({
      where: {
        name,
        batchId,
        isActive: true
      }
    });

    if (existingSection) {
      return NextResponse.json({ error: 'Section already exists' }, { status: 409 });
    }

    const section = await db.section.create({
      data: {
        name,
        batchId
      },
      include: {
        batch: {
          include: {
            program: {
              include: {
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
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Sections POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}