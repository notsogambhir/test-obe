import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const bulkStudentSchema = z.object({
  students: z.array(z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    name: z.string().min(1, 'Student name is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    programId: z.string().optional(),
    batchId: z.string().optional(),
  })).min(1, 'At least one student is required')
});

// POST /api/students/bulk - Bulk create students
export async function POST(request: NextRequest) {
  try {
    console.log('=== STUDENT BULK UPLOAD API ===');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Pre-process the data to ensure all fields are strings
    if (body.students && Array.isArray(body.students)) {
      body.students = body.students.map((student: any) => ({
        studentId: String(student.studentId || '').trim(),
        name: String(student.name || '').trim(),
        password: String(student.password || 'password123'),
        programId: student.programId ? String(student.programId).trim() : undefined,
        batchId: student.batchId ? String(student.batchId).trim() : undefined,
      }));
    }
    
    const { students } = bulkStudentSchema.parse(body);
    console.log('Validated students count:', students.length);

    if (!students || students.length === 0) {
      console.log('No students provided');
      return NextResponse.json(
        { error: 'No students provided' },
        { status: 400 }
      );
    }

    const results = {
      successful: [],
      failed: [],
      duplicates: []
    } as {
      successful: any[];
      failed: any[];
      duplicates: any[];
    };

    // Process each student
    for (const studentData of students) {
      try {
        // Check if student ID already exists
        const existingStudent = await db.user.findUnique({
          where: { studentId: studentData.studentId.trim() },
        });

        if (existingStudent) {
          results.duplicates.push({
            studentId: studentData.studentId,
            name: studentData.name,
            reason: 'Student ID already exists'
          });
          continue;
        }

        // Check if batch exists (if provided)
        if (studentData.batchId) {
          const batch = await db.batch.findUnique({
            where: { id: studentData.batchId },
          });

          if (!batch) {
            results.failed.push({
              studentId: studentData.studentId,
              name: studentData.name,
              reason: 'Batch not found'
            });
            continue;
          }
        }

        // Create the student
        const student = await db.user.create({
          data: {
            studentId: studentData.studentId.trim(),
            name: studentData.name.trim(),
            password: studentData.password,
            role: 'STUDENT',
            programId: studentData.programId,
            batchId: studentData.batchId,
          },
          include: {
            batch: {
              include: {
                program: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
            program: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        });

        results.successful.push(student);
      } catch (error) {
        results.failed.push({
          studentId: studentData.studentId,
          name: studentData.name,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Bulk upload completed. ${results.successful.length} successful, ${results.failed.length} failed, ${results.duplicates.length} duplicates.`,
      results
    });
  } catch (error) {
    console.error('Error in bulk student creation:', error);
    if (error instanceof z.ZodError) {
      console.log('Validation error details:', JSON.stringify(error.issues, null, 2));
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.issues,
          message: 'Excel file format issue. Please ensure: 1) Student IDs are text (not numbers), 2) Required columns: "Student ID" and "Student Name", 3) No empty rows'
        },
        { status: 400 }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}