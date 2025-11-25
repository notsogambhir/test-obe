import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { hashPassword } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; }> }
) {
  try {
    // Verify authentication - only ADMIN can update users
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    const {
      name,
      email,
      employeeId,
      password,
      role,
      collegeId,
      programId,
      isActive
    } = body;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email already exists (for other users)
    if (email && email !== existingUser.email) {
      const emailUser = await db.user.findUnique({
        where: { email }
      });

      if (emailUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Check if employee ID already exists (for other users)
    if (employeeId && employeeId !== existingUser.employeeId) {
      const employeeUser = await db.user.findUnique({
        where: { employeeId }
      });

      if (employeeUser) {
        return NextResponse.json(
          { error: 'Employee ID already exists' },
          { status: 400 }
        );
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR', 'TEACHER', 'STUDENT'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (employeeId !== undefined) updateData.employeeId = employeeId || null;
    if (password) updateData.password = await hashPassword(password);
    if (role !== undefined) updateData.role = role;
    if (collegeId !== undefined) updateData.collegeId = collegeId || null;
    if (programId !== undefined) updateData.programId = programId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update user
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        program: {
          select: {
            name: true,
            code: true
          }
        },
        college: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; }> }
) {
  try {
    // Verify authentication - only ADMIN can delete users
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const params = await context.params;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deleting themselves
    if (existingUser.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    await db.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}