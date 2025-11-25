import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || !['ADMIN', 'UNIVERSITY', 'PROGRAM_COORDINATOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Admin, University, or Program Coordinator access required' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { code, description, isActive } = await request.json();

    if (!code || !description) {
      return NextResponse.json(
        { error: 'Code and description are required' },
        { status: 400 }
      );
    }

    // Check if PO exists
    const existingPO = await db.pO.findUnique({
      where: { id },
      include: {
        program: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingPO) {
      return NextResponse.json(
        { error: 'Program Outcome not found' },
        { status: 404 }
      );
    }

    // Check if user has permission for this program
    if (user.role === 'PROGRAM_COORDINATOR' && existingPO.programId !== user.programId) {
      return NextResponse.json(
        { error: 'You can only update POs from your assigned program' },
        { status: 403 }
      );
    }

    // Check if another PO with same code exists in the same program
    const duplicatePO = await db.pO.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { programId: existingPO.programId },
          { code: code }
        ]
      }
    });

    if (duplicatePO) {
      return NextResponse.json(
        { error: 'Program Outcome with this code already exists in this program' },
        { status: 409 }
      );
    }

    const po = await db.pO.update({
      where: { id },
      data: {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        isActive: isActive !== undefined ? isActive : existingPO.isActive
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            mappings: true
          }
        }
      }
    });

    return NextResponse.json(po);
  } catch (error) {
    console.error('Error updating PO:', error);
    return NextResponse.json(
      { error: 'Failed to update Program Outcome' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || !['ADMIN', 'UNIVERSITY', 'PROGRAM_COORDINATOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Admin, University, or Program Coordinator access required' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if PO exists
    const existingPO = await db.pO.findUnique({
      where: { id },
      include: {
        program: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            mappings: true
          }
        }
      }
    });

    if (!existingPO) {
      return NextResponse.json(
        { error: 'Program Outcome not found' },
        { status: 404 }
      );
    }

    // Check if user has permission for this program
    if (user.role === 'PROGRAM_COORDINATOR' && existingPO.programId !== user.programId) {
      return NextResponse.json(
        { error: 'You can only delete POs from your assigned program' },
        { status: 403 }
      );
    }

    // Check if PO has associated CO-PO mappings
    if (existingPO._count.mappings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete PO with associated CO-PO mappings' },
        { status: 400 }
      );
    }

    await db.pO.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Program Outcome deleted successfully',
      deletedPO: {
        code: existingPO.code,
        description: existingPO.description
      }
    });
  } catch (error) {
    console.error('Error deleting PO:', error);
    return NextResponse.json(
      { error: 'Failed to delete Program Outcome' },
      { status: 500 }
    );
  }
}