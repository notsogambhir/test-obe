import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Fetch course with detailed information
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        batch: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        courseOutcomes: {
          where: { isActive: true },
          orderBy: { code: 'asc' }
        },
        assessments: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        enrollments: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                studentId: true
              }
            }
          }
        },
        _count: {
          select: {
            courseOutcomes: {
              where: { isActive: true }
            },
            assessments: {
              where: { isActive: true }
            },
            enrollments: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Format the response
    const formattedCourse = {
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description,
      status: course.status,
      isActive: course.isActive,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      programId: course.batch.program.id,
      programName: course.batch.program.name,
      programCode: course.batch.program.code,
      batchId: course.batch.id,
      batchName: course.batch.name,
      stats: {
        students: course._count.enrollments,
        assessments: course._count.assessments,
        cos: course._count.courseOutcomes
      },
      courseOutcomes: course.courseOutcomes,
      assessments: course.assessments,
      enrollments: course.enrollments
    };

    return NextResponse.json(formattedCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;
    const body = await request.json();
    const {
      code,
      name,
      description,
      status,
      targetPercentage,
      level1Threshold,
      level2Threshold,
      level3Threshold,
      isActive
    } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if course exists and get current data
    const existingCourse = await db.course.findUnique({
      where: { id: courseId },
      include: {
        batch: {
          include: {
            program: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if user has permission for this course
    if (user.role === 'PROGRAM_COORDINATOR' && existingCourse.batch.programId !== user.programId) {
      return NextResponse.json({ 
        error: 'You can only update courses from your assigned program' 
      }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (code !== undefined) {
      // Check if another course with same code exists in same batch
      const duplicateCourse = await db.course.findFirst({
        where: {
          AND: [
            { id: { not: courseId } },
            { batchId: existingCourse.batchId },
            { code: code }
          ]
        }
      });

      if (duplicateCourse) {
        return NextResponse.json(
          { error: 'Course with this code already exists in this batch' },
          { status: 409 }
        );
      }
      updateData.code = code.trim();
    }
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Status validation
    if (status !== undefined) {
      if (!['FUTURE', 'ACTIVE', 'COMPLETED'].includes(status)) {
        return NextResponse.json({ 
          error: 'Invalid status. Must be FUTURE, ACTIVE, or COMPLETED' 
        }, { status: 400 });
      }
      updateData.status = status;
    }

    // Threshold validation
    if (targetPercentage !== undefined) {
      const target = parseFloat(targetPercentage);
      if (isNaN(target) || target < 0 || target > 100) {
        return NextResponse.json({ 
          error: 'Target percentage must be between 0 and 100' 
        }, { status: 400 });
      }
      updateData.targetPercentage = target;
    }

    if (level1Threshold !== undefined) {
      const threshold = parseFloat(level1Threshold);
      if (isNaN(threshold) || threshold < 0 || threshold > 100) {
        return NextResponse.json({ 
          error: 'Level 1 threshold must be between 0 and 100' 
        }, { status: 400 });
      }
      updateData.level1Threshold = threshold;
    }

    if (level2Threshold !== undefined) {
      const threshold = parseFloat(level2Threshold);
      if (isNaN(threshold) || threshold < 0 || threshold > 100) {
        return NextResponse.json({ 
          error: 'Level 2 threshold must be between 0 and 100' 
        }, { status: 400 });
      }
      updateData.level2Threshold = threshold;
    }

    if (level3Threshold !== undefined) {
      const threshold = parseFloat(level3Threshold);
      if (isNaN(threshold) || threshold < 0 || threshold > 100) {
        return NextResponse.json({ 
          error: 'Level 3 threshold must be between 0 and 100' 
        }, { status: 400 });
      }
      updateData.level3Threshold = threshold;
    }

    // Validate threshold hierarchy (level1 <= level2 <= level3)
    const thresholds = [
      updateData.level1Threshold || existingCourse.level1Threshold,
      updateData.level2Threshold || existingCourse.level2Threshold,
      updateData.level3Threshold || existingCourse.level3Threshold
    ].filter(t => t !== undefined);

    if (thresholds.length === 3) {
      if (thresholds[0] > thresholds[1] || thresholds[1] > thresholds[2]) {
        return NextResponse.json({ 
          error: 'Thresholds must be in ascending order (Level 1 <= Level 2 <= Level 3)' 
        }, { status: 400 });
      }
    }

    const course = await db.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        batch: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        courseOutcomes: {
          where: { isActive: true },
          orderBy: { code: 'asc' }
        },
        assessments: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        enrollments: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                studentId: true
              }
            }
          }
        },
        _count: {
          select: {
            courseOutcomes: {
              where: { isActive: true }
            },
            assessments: {
              where: { isActive: true }
            },
            enrollments: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    // Format response
    const formattedCourse = {
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description,
      status: course.status,
      targetPercentage: course.targetPercentage,
      level1Threshold: course.level1Threshold,
      level2Threshold: course.level2Threshold,
      level3Threshold: course.level3Threshold,
      isActive: course.isActive,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      programId: course.batch.program.id,
      programName: course.batch.program.name,
      programCode: course.batch.program.code,
      batchId: course.batch.id,
      batchName: course.batch.name,
      stats: {
        students: course._count.enrollments,
        assessments: course._count.assessments,
        cos: course._count.courseOutcomes
      },
      courseOutcomes: course.courseOutcomes,
      assessments: course.assessments,
      enrollments: course.enrollments
    };

    return NextResponse.json(formattedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    if (!canCreateCourse(user)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin, university, department, and program coordinator roles can delete courses.' 
      }, { status: 403 });
    }

    console.log('=== DELETING COURSE ===');
    console.log('Course ID:', courseId);
    console.log('User:', { id: user.id, role: user.role, name: user.name });

    // Check if course exists and get its details
    const course = await db.course.findUnique({
      where: { id: courseId },
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

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Additional permission check for program coordinators
    if (user.role === 'PROGRAM_COORDINATOR' && course.batch.programId !== user.programId) {
      return NextResponse.json({ 
        error: 'You can only delete courses from your assigned program' 
      }, { status: 403 });
    }

    console.log('Course found:', course.code, course.name);
    console.log('Related records:', course._count);

    // Delete related records in order to respect foreign key constraints
    
    // 1. Delete CO-PO Mappings first (as they reference COs)
    await db.cOPOMapping.deleteMany({
      where: {
        courseId: courseId
      }
    });
    console.log('Deleted CO-PO mappings');

    // 2. Delete Questions (as they reference Assessments and COs)
    const assessments = await db.assessment.findMany({
      where: { courseId: courseId }
    });
    
    for (const assessment of assessments) {
      await db.question.deleteMany({
        where: { assessmentId: assessment.id }
      });
    }
    console.log('Deleted questions for all assessments');

    // 3. Delete Assessments
    await db.assessment.deleteMany({
      where: { courseId: courseId }
    });
    console.log('Deleted assessments');

    // 4. Delete COs (after questions and mappings are deleted)
    await db.cO.deleteMany({
      where: { courseId: courseId }
    });
    console.log('Deleted COs');

    // 5. Delete Enrollments
    await db.enrollment.deleteMany({
      where: { courseId: courseId }
    });
    console.log('Deleted enrollments');

    // 6. Finally delete the course
    await db.course.delete({
      where: { id: courseId }
    });
    console.log('Deleted course successfully');

    return NextResponse.json({ 
      message: 'Course deleted successfully',
      deletedCourse: {
        code: course.code,
        name: course.name
      }
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ 
      error: 'Failed to delete course',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}