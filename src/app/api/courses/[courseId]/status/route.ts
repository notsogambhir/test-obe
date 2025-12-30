import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';

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

    if (!canCreateCourse(user)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin, university, department, and program coordinator roles can update course status.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['FUTURE', 'ACTIVE', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be FUTURE, ACTIVE, or COMPLETED' 
      }, { status: 400 });
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

    // Check permissions for program coordinators
    if (user.role === 'PROGRAM_COORDINATOR' && course.batch.programId !== user.programId) {
      return NextResponse.json({ 
        error: 'You can only update status for courses in your assigned program' 
      }, { status: 403 });
    }

    // Update course status
    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    console.log(`Updated course ${course.code} status to ${status}`);

    // If changing from FUTURE to ACTIVE, automatically enroll eligible students
    let enrollmentData: {
      totalEligible: number;
      successfullyEnrolled: number;
      students: {
        id: string;
        name: string;
        studentId: string | null;
        email: string | null;
      }[];
    } | null = null;
    if (course.status === 'FUTURE' && status === 'ACTIVE') {
      console.log(`Course ${course.code} changed from FUTURE to ACTIVE - processing automatic enrollment`);
      
      // Find all active students who should be enrolled in this course
      // Students should be enrolled if they belong to the same batch and are active
      const eligibleStudents = await db.user.findMany({
        where: {
          role: 'STUDENT',
          isActive: true,
          batchId: course.batchId,
          // Only enroll students who are assigned to this batch's program
          programId: course.batch.programId
        },
        select: {
          id: true,
          name: true,
          studentId: true,
          email: true
        }
      });

      console.log(`Found ${eligibleStudents.length} eligible students for automatic enrollment`);

      if (eligibleStudents.length > 0) {
        // Create enrollments for all eligible students with better error handling
        let successfulEnrollments = 0;

        // Process students sequentially to avoid database overload and hanging
        for (const student of eligibleStudents) {
          try {
            // Check if student is already enrolled
            const existingEnrollment = await db.enrollment.findFirst({
              where: {
                courseId: courseId,
                studentId: student.id
              }
            });

            if (!existingEnrollment) {
              await db.enrollment.create({
                data: {
                  courseId: courseId,
                  studentId: student.id,
                  isActive: true
                }
              });
              console.log(`Enrolled student: ${student.name} (${student.studentId})`);
              successfulEnrollments++;
            } else {
              console.log(`Student ${student.name} already enrolled, skipping`);
            }
          } catch (error) {
            console.error(`Error enrolling student ${student.name}:`, error);
            // Continue with next student even if one fails
          }
        }

        console.log(`Successfully enrolled ${successfulEnrollments} out of ${eligibleStudents.length} eligible students`);

        enrollmentData = {
          totalEligible: eligibleStudents.length,
          successfullyEnrolled: successfulEnrollments,
          students: eligibleStudents.map(s => ({
            id: s.id,
            name: s.name,
            studentId: s.studentId,
            email: s.email
          }))
        };
      }
    }

    // Get updated course with enrollment count
    const courseWithEnrollments = await db.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    return NextResponse.json({
      message: status === 'ACTIVE' && course.status === 'FUTURE' && enrollmentData
        ? `Course status updated to ${status}. Automatic enrollment completed: ${enrollmentData.successfullyEnrolled} students enrolled.`
        : `Course status updated to ${status}`,
      course: courseWithEnrollments,
      enrollmentData,
      _count: courseWithEnrollments?._count
    });

  } catch (error) {
    console.error('Error updating course status:', error);
    return NextResponse.json({ 
      error: 'Failed to update course status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}