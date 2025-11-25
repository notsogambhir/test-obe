import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and permissions
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Only admin, university, and department roles can assign programs
    if (!['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign programs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, programIds } = body;

    if (!userId || !programIds || !Array.isArray(programIds) || programIds.length === 0) {
      return NextResponse.json(
        { error: 'User ID and at least one program ID are required' },
        { status: 400 }
      );
    }

    // Verify the target user exists and is a program coordinator
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        program: true
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.role !== 'PROGRAM_COORDINATOR') {
      return NextResponse.json(
        { error: 'Programs can only be assigned to program coordinators' },
        { status: 400 }
      );
    }

    // For department users, verify they can only assign programs from their college
    if (user.role === 'DEPARTMENT') {
      // Verify all programs belong to the user's college
      const programs = await db.program.findMany({
        where: {
          id: { in: programIds || [] },
          collegeId: user.collegeId || undefined
        }
      });

      if (programs.length !== programIds.length) {
        return NextResponse.json(
          { error: 'You can only assign programs from your college' },
          { status: 403 }
        );
      }

      // Verify target user is in the same college
      if (targetUser.collegeId !== user.collegeId) {
        return NextResponse.json(
          { error: 'You can only assign programs to coordinators in your college' },
          { status: 403 }
        );
      }
    }

    // Verify all programs exist
    const programs = await db.program.findMany({
      where: {
        id: { in: programIds }
      }
    });

    if (programs.length !== programIds.length) {
      return NextResponse.json(
        { error: 'One or more programs not found' },
        { status: 404 }
      );
    }

    // For now, we'll assign the first program as the primary program
    // In a future enhancement, we could support multiple programs per coordinator
    const primaryProgramId = programIds[0];

    // Update the user's program assignment
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        programId: primaryProgramId,
        // Clear batchId when changing program to avoid conflicts
        batchId: null
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
      message: 'Programs assigned successfully',
      user: updatedUser,
      assignedPrograms: programs
    });

  } catch (error) {
    console.error('Error assigning programs:', error);
    return NextResponse.json(
      { error: 'Failed to assign programs' },
      { status: 500 }
    );
  }
}