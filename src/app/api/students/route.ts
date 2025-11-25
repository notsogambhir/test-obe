import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { studentSchema } from '@/lib/validations/student';

// GET /api/students - Get all students for the current program/batch
export async function GET(request: NextRequest) {
  try {
    // Get user using by enhanced auth function (supports both header and cookie)
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - No valid token provided' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const batchId = searchParams.get('batchId');
    const collegeId = searchParams.get('collegeId');

    // Build where clause based on user role and provided parameters
    let whereClause: any = { 
      role: 'STUDENT',
      isActive: true  // Only show active students
    };
    
    if (user.role === 'DEPARTMENT' || user.role === 'PROGRAM_COORDINATOR') {
      // Department users can only see students from their programs
      if (programId) {
        whereClause.programId = programId;
      } else if (user.programId) {
        whereClause.programId = user.programId;
      }
      
      if (batchId) {
        whereClause.batchId = batchId;
      } else if (user.batchId) {
        whereClause.batchId = user.batchId;
      }

      // If collegeId is provided, filter by programs under that college
      if (collegeId && !programId) {
        // Find all programs under this college
        const programs = await db.program.findMany({
          where: { collegeId },
          select: { id: true }
        });
        const programIds = programs.map(p => p.id);
        if (programIds.length > 0) {
          whereClause.programId = { in: programIds };
        }
      }
    }

    // Handle other roles (ADMIN, UNIVERSITY, etc.)
    if (user.role === 'ADMIN' || user.role === 'UNIVERSITY') {
      if (collegeId && !programId) {
        // Find all programs under this college
        const programs = await db.program.findMany({
          where: { collegeId },
          select: { id: true }
        });
        const programIds = programs.map(p => p.id);
        if (programIds.length > 0) {
          whereClause.programId = { in: programIds };
        }
      }

      // If specific program or batch is requested, use it
      if (programId) {
        whereClause.programId = programId;
      }
      if (batchId) {
        whereClause.batchId = batchId;
      }
    }

    const students = await db.user.findMany({
      where: whereClause,
      include: {
        college: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
            startYear: true,
            endYear: true,
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        section: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    // Get user using enhanced auth function (supports both header and cookie)
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - No valid token provided' }, { status: 401 });
    }

    // Only department, program coordinator, and admin roles can create students
    if (!['DEPARTMENT', 'PROGRAM_COORDINATOR', 'ADMIN', 'UNIVERSITY'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Student creation request body:', body);
    
    // Sanitize input data
    const sanitizedBody = {
      ...body,
      studentId: body.studentId?.trim(),
      name: body.name?.trim(),
      email: body.email?.trim(),
      password: body.password?.trim(),
      collegeId: body.collegeId?.trim(),
      programId: body.programId?.trim(),
      batchId: body.batchId?.trim(),
    };
    
    const validatedData = studentSchema.parse(sanitizedBody);
    console.log('Validated student data:', validatedData);

    // Check if student ID already exists
    const existingStudent = await db.user.findUnique({
      where: { studentId: validatedData.studentId },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student with this ID already exists' },
        { status: 409 }
      );
    }

    // Validate password length
    if (!validatedData.password || validatedData.password.length < 3) {
      return NextResponse.json(
        { error: 'Password must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Set college, program, and batch based on user context if not provided
    if (!validatedData.collegeId && user.collegeId) {
      validatedData.collegeId = user.collegeId;
    }
    if (!validatedData.programId && user.programId) {
      validatedData.programId = user.programId;
    }
    if (!validatedData.batchId && user.batchId) {
      validatedData.batchId = user.batchId;
    }

    // Validate that collegeId, programId, and batchId are provided and valid
    if (!validatedData.collegeId || validatedData.collegeId.trim() === '') {
      return NextResponse.json(
        { error: 'College ID is required. Please select a college.' },
        { status: 400 }
      );
    }

    if (!validatedData.programId || validatedData.programId.trim() === '') {
      return NextResponse.json(
        { error: 'Program ID is required. Please ensure you are assigned to a program.' },
        { status: 400 }
      );
    }

    if (!validatedData.batchId || validatedData.batchId.trim() === '') {
      return NextResponse.json(
        { error: 'Batch ID is required. Please ensure you are assigned to a batch.' },
        { status: 400 }
      );
    }

    // Verify that college exists
    const college = await db.college.findUnique({
      where: { id: validatedData.collegeId },
    });

    if (!college) {
      return NextResponse.json(
        { error: 'Invalid college ID' },
        { status: 400 }
      );
    }

    // Verify that program exists and belongs to the college
    const program = await db.program.findUnique({
      where: { id: validatedData.programId },
    });

    if (!program || program.collegeId !== validatedData.collegeId) {
      return NextResponse.json(
        { error: 'Invalid program ID or program does not belong to the specified college' },
        { status: 400 }
      );
    }

    // Verify that batch exists and belongs to the program
    const batch = await db.batch.findUnique({
      where: { id: validatedData.batchId },
    });

    if (!batch || batch.programId !== validatedData.programId) {
      return NextResponse.json(
        { error: 'Invalid batch ID or batch does not belong to the specified program' },
        { status: 400 }
      );
    }

    // Create student
    const studentPassword = validatedData.password || 'defaultPassword123';
    
    const student = await db.user.create({
      data: {
        studentId: validatedData.studentId,
        name: validatedData.name,
        email: validatedData.email,
        password: studentPassword,
        role: 'STUDENT',
        collegeId: validatedData.collegeId,
        programId: validatedData.programId,
        batchId: validatedData.batchId,
        isActive: true,
      },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
            startYear: true,
            endYear: true,
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        section: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    // Auto-assign student to a section if batch has sections
    if (batch && validatedData.batchId) {
      const sections = await db.section.findMany({
        where: {
          batchId: validatedData.batchId,
          isActive: true
        },
        orderBy: { name: 'asc' }
      });

      if (sections.length > 0) {
        // Assign to first available section
        const firstSection = sections[0];
        await db.user.update({
          where: { id: student.id },
          data: {
            sectionId: firstSection.id
          }
        });
        
        // Update the student object with section info
        student.sectionId = firstSection.id;
        student.section = { id: firstSection.id, name: firstSection.name };
      }
    }

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    
    if (error instanceof ZodError) {
      console.error('Zod validation errors:', JSON.stringify(error.issues, null, 2));
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}