import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';

// GET handler - fetch courses by batch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    const courses = await db.course.findMany({
      where: { batchId },
      include: {
        batch: {
          include: {
            program: {
              include: {
                college: true
              }
            }
          }
        },
        _count: {
          select: {
            courseOutcomes: true,
            assessments: true,
            enrollments: true,
            coPOMappings: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses by batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    if (!canCreateCourse(user)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin, university, department, and program coordinator roles can perform batch operations.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { courseIds, action, data } = body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: 'Course IDs are required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    console.log('=== BATCH OPERATION ===');
    console.log('Action:', action);
    console.log('Course IDs:', courseIds);
    console.log('User:', { id: user.id, role: user.role, name: user.name });

    let results: any[] = [];
    let errors: any[] = [];

    // Verify user has access to all courses
    const courses = await db.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        batch: {
          include: {
            program: true
          }
        },
        _count: {
          select: {
            courseOutcomes: true,
            assessments: true,
            enrollments: true,
            coPOMappings: true
          }
        }
      }
    });

    // Check permissions for program coordinators
    if (user.role === 'PROGRAM_COORDINATOR') {
      for (const course of courses) {
        if (course.batch.programId !== user.programId) {
          return NextResponse.json({ 
            error: `You can only perform operations on courses from your assigned program. Course ${course.code} is from ${course.batch.program.name}` 
          }, { status: 403 });
        }
      }
    }

    // Perform batch operation based on action
    switch (action) {
      case 'delete':
        for (const course of courses) {
          try {
            // Check if course can be deleted
            if (course.status === 'ACTIVE' && course._count.enrollments > 0) {
              errors.push({
                courseId: course.id,
                courseCode: course.code,
                error: 'Cannot delete active course with enrolled students'
              });
              continue;
            }

            // Delete related records in order
            await db.cOPOMapping.deleteMany({
              where: { courseId: course.id }
            });

            const assessments = await db.assessment.findMany({
              where: { courseId: course.id }
            });
            
            for (const assessment of assessments) {
              await db.question.deleteMany({
                where: { assessmentId: assessment.id }
              });
            }

            await db.assessment.deleteMany({
              where: { courseId: course.id }
            });

            await db.cO.deleteMany({
              where: { courseId: course.id }
            });

            await db.enrollment.deleteMany({
              where: { courseId: course.id }
            });

            await db.course.delete({
              where: { id: course.id }
            });

            results.push({
              courseId: course.id,
              courseCode: course.code,
              courseName: course.name,
              action: 'deleted'
            });

          } catch (error) {
            console.error(`Error deleting course ${course.code}:`, error);
            errors.push({
              courseId: course.id,
              courseCode: course.code,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        break;

      case 'updateStatus':
        const { status } = data;
        
        if (!['FUTURE', 'ACTIVE', 'COMPLETED'].includes(status)) {
          return NextResponse.json({ 
            error: 'Invalid status. Must be FUTURE, ACTIVE, or COMPLETED' 
          }, { status: 400 });
        }

        for (const course of courses) {
          try {
            const updatedCourse = await db.course.update({
              where: { id: course.id },
              data: { status }
            });

            results.push({
              courseId: course.id,
              courseCode: course.code,
              courseName: course.name,
              action: 'statusUpdated',
              oldStatus: course.status,
              newStatus: status
            });

          } catch (error) {
            console.error(`Error updating status for course ${course.code}:`, error);
            errors.push({
              courseId: course.id,
              courseCode: course.code,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      message: `Batch ${action} completed`,
      results,
      errors,
      totalProcessed: courseIds.length,
      successCount: results.length,
      errorCount: errors.length
    });

  } catch (error) {
    console.error('Error in batch operation:', error);
    return NextResponse.json({ 
      error: 'Failed to perform batch operation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}