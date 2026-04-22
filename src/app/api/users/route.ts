import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { hashPassword } from '@/lib/auth';
import { canManageCollegeResources } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const programId = searchParams.get('programId');
    const collegeId = searchParams.get('collegeId');

    // Build where clause based on user role and filters
    let whereClause: any = {};

    if (role) {
      whereClause.role = role;
    }

    if (programId) {
      whereClause.programId = programId;
    }

    // Apply role-based filtering
    switch (user.role) {
      case 'ADMIN':
      case 'UNIVERSITY':
        // Can see all users, but respect the collegeId filter if provided
        if (collegeId) {
          whereClause.collegeId = collegeId;
        }
        break;
        
      case 'DEPARTMENT':
        // Can only see users from their college
        whereClause.collegeId = user.collegeId;
        break;
        
      case 'PROGRAM_COORDINATOR':
        // Can only see users from their program
        whereClause.programId = user.programId;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
    }

    const users = await db.user.findMany({
      where: whereClause,
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
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getUserFromRequest(request);
    
    // Only ADMIN can create staff users (Fix #9)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required for staff user management' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      employeeId,
      password,
      role,
      collegeId,
      programId
    } = body;

    // Validation: Name, Role, and at least one login identifier are required
    if (!name || !password || !role) {
      return NextResponse.json(
        { error: 'Name, password, and role are required' },
        { status: 400 }
      );
    }

    if (!email && !employeeId) {
      return NextResponse.json(
        { error: 'At least one of email or employee ID is required for account identification' },
        { status: 400 }
      );
    }

    // Password strength check
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }


    // Check if email already exists
    if (email) {
      const existingUser = await db.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Check if employee ID already exists
    if (employeeId) {
      const existingEmployee = await db.user.findUnique({
        where: { employeeId }
      });

      if (existingEmployee) {
        return NextResponse.json(
          { error: 'Employee ID already exists' },
          { status: 400 }
        );
      }
    }

    // Validate role
    const validRoles = ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR', 'TEACHER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Determine college ID for new user
    let finalCollegeId = collegeId;

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await db.user.create({
      data: {
        name,
        email: email || null,
        employeeId: employeeId || null,
        password: hashedPassword,
        role,
        collegeId: finalCollegeId || null,
        programId: programId || null,
        isActive: true
      },
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
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}