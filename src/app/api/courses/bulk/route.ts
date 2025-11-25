import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courses, programId, batchId } = body;

    console.log('Bulk upload request:', { courses, programId, batchId });

    // Validate required fields
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { message: 'Courses array is required' },
        { status: 400 }
      );
    }

    if (!programId || !batchId) {
      return NextResponse.json(
        { message: `Program ID and Batch ID are required. Received: Program ID=${programId}, Batch ID=${batchId}` },
        { status: 400 }
      );
    }

    // Verify that the program and batch exist
    const program = await db.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return NextResponse.json(
        { message: `Program with ID ${programId} not found` },
        { status: 400 }
      );
    }

    const batch = await db.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json(
        { message: `Batch with ID ${batchId} not found` },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Process each course
    for (const courseData of courses) {
      try {
        const { code, name } = courseData;

        // Validate course data
        if (!code || !name) {
          errors.push({
            course: courseData,
            error: 'Course code and name are required'
          });
          continue;
        }

        // Check if course already exists
        const existingCourse = await db.course.findFirst({
          where: {
            code: code.toUpperCase(),
            batchId,
          },
        });

        if (existingCourse) {
          errors.push({
            course: courseData,
            error: 'Course with this code already exists in this program and batch'
          });
          continue;
        }

        // Create the course
        const course = await db.course.create({
          data: {
            code: code.toUpperCase(),
            name: name.trim(),
            batchId,
          },
          include: {
            batch: {
              select: {
                name: true,
                startYear: true,
                endYear: true,
              },
            },
          },
        });

        results.push(course);

      } catch (error) {
        console.error('Error creating course:', error);
        errors.push({
          course: courseData,
          error: 'Failed to create course'
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${courses.length} courses. ${results.length} created, ${errors.length} failed.`,
      results,
      errors,
      totalProcessed: courses.length,
      successCount: results.length,
      failureCount: errors.length,
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}