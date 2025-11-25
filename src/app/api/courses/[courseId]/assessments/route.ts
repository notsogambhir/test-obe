import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canTeacherManageCourse } from '@/lib/permissions';

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

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Fetch assessments for the course
    const { searchParams } = new URL(request.url);
    const sectionIds = searchParams.get('sectionIds');
    
    let whereClause: any = {
      courseId,
      isActive: true
    };

    // For teachers, automatically filter by their assigned sections if sectionIds not provided
    if (user.role === 'TEACHER' && !sectionIds) {
      // Get teacher's assigned sections for this course
      const teacherAssignments = await db.teacherAssignment.findMany({
        where: {
          teacherId: user.id,
          courseId: courseId,
          isActive: true
        },
        select: {
          sectionId: true
        }
      });

      const assignedSectionIds = teacherAssignments
        .map(ta => ta.sectionId)
        .filter(Boolean);

      if (assignedSectionIds.length > 0) {
        whereClause.sectionId = {
          in: assignedSectionIds
        };
      } else {
        // If teacher has no assigned sections, return empty array
        return NextResponse.json([]);
      }
    }
    // If sectionIds are explicitly provided (e.g., from frontend filtering), use them
    else if (sectionIds) {
      const sectionIdArray = sectionIds.split(',');
      whereClause.sectionId = {
        in: sectionIdArray
      };
    }

    const assessments = await db.assessment.findMany({
      where: whereClause,
      include: {
        section: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

export async function POST(
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

    console.log('Assessment creation permission check:', {
      userRole: user.role,
      userId: user.id,
      courseId,
    });

    const body = await request.json();
    const { name, type, maxMarks, weightage, sectionId } = body;

    if (!name || !type || !maxMarks || !weightage || !sectionId) {
      return NextResponse.json({ error: 'All assessment fields are required, including sectionId' }, { status: 400 });
    }

    if (!['exam', 'quiz', 'assignment', 'project'].includes(type)) {
      return NextResponse.json({ error: 'Invalid assessment type' }, { status: 400 });
    }

    // Get the course to verify permissions
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

    // Check permissions based on user role and specific section assignment
    const canManageAssessments = 
      user.role === 'ADMIN' || 
      user.role === 'UNIVERSITY' || 
      (user.role === 'PROGRAM_COORDINATOR' && course.batch.programId === user.programId) ||
      (user.role === 'TEACHER' && await canTeacherManageCourse(user.id, courseId, sectionId));

    console.log('Can manage assessments result:', canManageAssessments);

    if (!canManageAssessments) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to create assessments for this course/section' 
      }, { status: 403 });
    }

    // Verify section exists and belongs to this course
    const section = await db.section.findUnique({
      where: { id: sectionId },
      include: {
        batch: true
      }
    });

    if (!section || section.batchId !== course.batchId) {
      return NextResponse.json({ error: 'Invalid section for this course' }, { status: 400 });
    }

    // Check if an inactive assessment with the same name already exists
    const existingAssessment = await db.assessment.findFirst({
      where: {
        courseId: courseId,
        sectionId: sectionId,
        name: name.trim(),
        isActive: false
      }
    });

    let newAssessment;
    
    if (existingAssessment) {
      // Reactivate the existing assessment instead of creating a new one
      newAssessment = await db.assessment.update({
        where: { id: existingAssessment.id },
        data: {
          type,
          maxMarks: parseInt(maxMarks),
          weightage: parseFloat(weightage),
          isActive: true,
          updatedAt: new Date()
        }
      });
      console.log(`Reactivated assessment ${name} for course ${courseId}`);
    } else {
      // Create new assessment
      newAssessment = await db.assessment.create({
        data: {
          courseId: courseId,
          sectionId: sectionId, // Include sectionId in the assessment
          name: name.trim(),
          type,
          maxMarks: parseInt(maxMarks),
          weightage: parseFloat(weightage),
          isActive: true
        }
      });
      console.log(`Created new assessment ${name} for course ${courseId}`);
    }

    return NextResponse.json(newAssessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}