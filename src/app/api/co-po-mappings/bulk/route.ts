import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, mappings } = body;

    if (!courseId || !Array.isArray(mappings)) {
      return NextResponse.json(
        { error: 'Course ID and mappings array are required' },
        { status: 400 }
      );
    }

    // Validate each mapping
    for (const mapping of mappings) {
      const { coId, poId, level } = mapping;
      if (!coId || !poId || level === undefined) {
        return NextResponse.json(
          { error: 'Each mapping must include coId, poId, and level' },
          { status: 400 }
        );
      }
      if (level < 0 || level > 3) {
        return NextResponse.json(
          { error: 'Level must be between 0 and 3' },
          { status: 400 }
        );
      }
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    if (!canCreateCourse(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage CO-PO mappings' },
        { status: 403 }
      );
    }

    // Verify course exists and user has access
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        batch: {
          include: {
            program: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check permissions for program coordinators
    if (user.role === 'PROGRAM_COORDINATOR' && course.batch.programId !== user.programId) {
      return NextResponse.json(
        { error: 'You can only manage CO-PO mappings for courses in your assigned program' },
        { status: 403 }
      );
    }

    // Use a transaction to ensure all mappings are saved or none are
    const result = await db.$transaction(async (tx) => {
      const savedMappings: any[] = [];

      for (const mapping of mappings) {
        const { coId, poId, level } = mapping;

        // Check if mapping already exists
        const existingMapping = await tx.cOPOMapping.findUnique({
          where: {
            coId_poId_courseId: {
              coId,
              poId,
              courseId
            }
          }
        });

        let savedMapping;
        if (existingMapping) {
          // Update existing mapping
          savedMapping = await tx.cOPOMapping.update({
            where: {
              coId_poId_courseId: {
                coId,
                poId,
                courseId
              }
            },
            data: { level, isActive: level > 0 }
          });
        } else {
          // Create new mapping
          savedMapping = await tx.cOPOMapping.create({
            data: {
              courseId,
              coId,
              poId,
              level,
              isActive: level > 0
            }
          });
        }

        savedMappings.push(savedMapping);
      }

      return savedMappings;
    });

    return NextResponse.json({
      message: 'CO-PO mappings saved successfully',
      mappings: result,
      count: result.length
    });

  } catch (error) {
    console.error('Error saving CO-PO mappings:', error);
    return NextResponse.json(
      { error: 'Failed to save CO-PO mappings' },
      { status: 500 }
    );
  }
}