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
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    if (!canCreateCourse(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view student CO attainments' },
        { status: 403 }
      );
    }

    console.log(`📊 Fetching enhanced student CO attainments for course ${courseId}`);

    // Get course details with COs
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        courseOutcomes: {
          where: { isActive: true },
          orderBy: { code: 'asc' }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get enrollments with student and section info
    const enrollments = await db.enrollment.findMany({
      where: {
        courseId: courseId,
        isActive: true
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true,
            sectionId: true
          }
        }
      }
    });

    if (enrollments.length === 0) {
      console.log(`❌ No enrollments found for course ${courseId}`);
      return NextResponse.json({ studentAttainments: [] });
    }

    console.log(`👥 Found ${enrollments.length} students enrolled in course ${courseId}`);

    // Create student attainments with mock CO data for now
    // TODO: Replace with real CO attainment calculations
    const studentAttainments = enrollments.map((enrollment) => {
      const coAttainments = course.courseOutcomes.map((co) => ({
        coId: co.id,
        coCode: co.code,
        percentage: Math.floor(Math.random() * 40) + 60, // Mock: 60-100%
        metTarget: Math.random() > 0.3, // Mock: 70% meet target
        totalObtainedMarks: Math.floor(Math.random() * 20) + 10,
        totalMaxMarks: 30,
        attemptedQuestions: Math.floor(Math.random() * 3) + 2,
        totalQuestions: 5,
        weightedScore: Math.floor(Math.random() * 30) + 70,
        maxWeightedScore: 100
      }));

      // Calculate overall attainment
      const validPercentages = coAttainments.map(co => co.percentage).filter(p => !isNaN(p));
      const overallAttainment = validPercentages.length > 0 
        ? validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length 
        : 0;
      
      const cosAttained = coAttainments.filter(co => co.metTarget).length;
      const totalCos = coAttainments.length;

      return {
        studentId: enrollment.student.id,
        studentName: enrollment.student.name,
        studentRollNo: enrollment.student.studentId || 'N/A',
        studentEmail: enrollment.student.email,
        sectionId: enrollment.student.sectionId,
        sectionName: enrollment.student.sectionId || 'Unassigned',
        coAttainments,
        overallAttainment: Math.round(overallAttainment * 100) / 100,
        cosAttained,
        totalCos,
        attainmentRate: totalCos > 0 ? (cosAttained / totalCos) * 100 : 0
      };
    });

    console.log(`✅ Generated enhanced student attainments for ${studentAttainments.length} students`);

    return NextResponse.json({
      studentAttainments,
      summary: {
        totalStudents: studentAttainments.length,
        averageAttainment: studentAttainments.length > 0 
          ? studentAttainments.reduce((sum, s) => sum + s.overallAttainment, 0) / studentAttainments.length 
          : 0,
        sections: [...new Set(enrollments.map(e => e.student.sectionId))].length,
        cos: course.courseOutcomes.length,
        note: 'Using mock CO attainment data - real calculation to be implemented'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching enhanced student CO attainments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enhanced student CO attainment data' },
      { status: 500 }
    );
  }
}