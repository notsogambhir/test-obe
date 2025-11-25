import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const whereClause = programId ? { programId } : {};

    const pos = await db.pO.findMany({
      where: { 
        ...whereClause,
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        program: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(pos);
  } catch (error) {
    console.error('Error fetching POs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch POs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Only Program Coordinators, Admins, and University can create POs
    if (!['PROGRAM_COORDINATOR', 'ADMIN', 'UNIVERSITY'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only Program Coordinators and above can create POs.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { programId, code, description } = body;

    if (!programId || !code || !description) {
      return NextResponse.json(
        { error: 'Program ID, code, and description are required' },
        { status: 400 }
      );
    }

    // For Program Coordinators, verify they have access to this program
    if (user.role === 'PROGRAM_COORDINATOR' && user.programId !== programId) {
      return NextResponse.json(
        { error: 'You can only create POs for your assigned program' },
        { status: 403 }
      );
    }

    // Check if PO code already exists for this program
    const existingPO = await db.pO.findFirst({
      where: {
        programId,
        code: code.toUpperCase()
      }
    });

    if (existingPO) {
      if (existingPO.isActive) {
        // PO exists and is active
        return NextResponse.json(
          { error: 'PO with this code already exists in this program' },
          { status: 409 }
        );
      } else {
        // PO exists but is inactive - reactivate it
        const reactivatedPO = await db.pO.update({
          where: { id: existingPO.id },
          data: {
            description: description.trim(),
            isActive: true
          },
          include: {
            program: {
              select: {
                name: true,
                code: true
              }
            }
          }
        });
        
        return NextResponse.json({
          ...reactivatedPO,
          reactivated: true
        }, { status: 200 });
      }
    }

    // Verify program exists
    const program = await db.program.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    const po = await db.pO.create({
      data: {
        programId,
        code: code.toUpperCase(),
        description: description.trim()
      },
      include: {
        program: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    return NextResponse.json(po, { status: 201 });
  } catch (error) {
    console.error('Error creating PO:', error);
    return NextResponse.json(
      { error: 'Failed to create PO' },
      { status: 500 }
    );
  }
}