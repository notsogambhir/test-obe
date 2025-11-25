import { NextRequest, NextResponse } from 'next/server';
import { COAttainmentCalculator } from '@/lib/co-attainment-calculator';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';
import { db } from '@/lib/db';

// Function to fetch existing attainments from database
async function getStoredAttainments(courseId: string, academicYear?: string) {
  try {
    const coAttainments = await db.cOAttainment.findMany({
      where: {
        courseId,
        academicYear: academicYear || null
      },
      include: {
        co: {
          select: {
            code: true,
            description: true
          }
        },
        course: {
          select: {
            name: true,
            code: true,
            targetPercentage: true,
            level1Threshold: true,
            level2Threshold: true,
            level3Threshold: true
          }
        }
      }
    });

    if (coAttainments.length === 0) {
      return null;
    }

    // Group by CO and calculate statistics
    const coGroups = coAttainments.reduce((acc, attainment) => {
      const coId = attainment.coId;
      if (!acc[coId]) {
        acc[coId] = {
          coId,
          coCode: attainment.co.code,
          coDescription: attainment.co.description,
          targetPercentage: attainment.course.targetPercentage,
          level1Threshold: attainment.course.level1Threshold,
          level2Threshold: attainment.course.level2Threshold,
          level3Threshold: attainment.course.level3Threshold,
          students: [],
          totalStudents: 0,
          studentsMeetingTarget: 0
        };
      }
      
      acc[coId].students.push({
        studentId: attainment.studentId,
        percentage: attainment.percentage,
        metTarget: attainment.metTarget
      });
      
      acc[coId].totalStudents++;
      if (attainment.metTarget) {
        acc[coId].studentsMeetingTarget++;
      }
      
      return acc;
    }, {} as any);

    // Calculate final statistics for each CO
    const coAttainmentResults = Object.values(coGroups).map(group => {
      const averagePercentage = group.students.length > 0 
        ? group.students.reduce((sum: number, s: any) => sum + s.percentage, 0) / group.students.length 
        : 0;
      
      let attainmentLevel = 0;
      if (averagePercentage >= group.level3Threshold) attainmentLevel = 3;
      else if (averagePercentage >= group.level2Threshold) attainmentLevel = 2;
      else if (averagePercentage >= group.level1Threshold) attainmentLevel = 1;
      
      return {
        coId: group.coId,
        coCode: group.coCode,
        coDescription: group.coDescription,
        targetPercentage: group.targetPercentage,
        attainedPercentage: averagePercentage,
        studentsAttained: group.studentsMeetingTarget,
        totalStudents: group.totalStudents,
        attainmentLevel,
        level1Threshold: group.level1Threshold,
        level2Threshold: group.level2Threshold,
        level3Threshold: group.level3Threshold
      };
    });

    return {
      courseId,
      courseName: coAttainments[0]?.course.name || 'Course',
      courseCode: coAttainments[0]?.course.code || 'COURSE',
      calculatedAt: coAttainments[0]?.calculatedAt || new Date(),
      coAttainments: coAttainmentResults,
      studentAttainments: coAttainments.map(attainment => ({
        studentId: attainment.studentId,
        coId: attainment.coId,
        coCode: attainment.co.code,
        percentage: attainment.percentage,
        metTarget: attainment.metTarget
      })),
      summary: {
        totalCOs: coAttainmentResults.length,
        totalStudents: Math.max(...coAttainmentResults.map(co => co.totalStudents), 0),
        averageAttainment: coAttainmentResults.length > 0 
          ? coAttainmentResults.reduce((sum, co) => sum + co.attainedPercentage, 0) / coAttainmentResults.length 
          : 0,
        levelDistribution: {
          level0: coAttainmentResults.filter(co => co.attainmentLevel === 0).length,
          level1: coAttainmentResults.filter(co => co.attainmentLevel === 1).length,
          level2: coAttainmentResults.filter(co => co.attainmentLevel === 2).length,
          level3: coAttainmentResults.filter(co => co.attainmentLevel === 3).length,
        }
      }
    };
  } catch (error) {
    console.error('Error fetching stored attainments:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;
    const body = await request.json();
    const { 
      academicYear,
      force = false 
    } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Only users with course creation permissions can calculate attainments
    if (!canCreateCourse(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to calculate CO attainments' },
        { status: 403 }
      );
    }

    console.log(`🚀 Starting CO attainment calculation for course ${courseId} by user ${user.name}`);

    // Calculate course attainment using the calculator
    const attainmentResult = await COAttainmentCalculator.calculateCourseAttainment(
      courseId,
      {
        academicYear
      }
    );

    if (!attainmentResult) {
      return NextResponse.json(
        { error: 'Failed to calculate CO attainments - no data found' },
        { status: 404 }
      );
    }

    // Save attainments to database if requested
    if (force) {
      try {
        await COAttainmentCalculator.saveAttainments(
          courseId,
          attainmentResult.studentAttainments,
          academicYear
        );
        console.log(`💾 Saved ${attainmentResult.studentAttainments.length} attainments to database`);
      } catch (saveError) {
        console.error('❌ Error saving attainments:', saveError);
        // Continue even if save fails
      }
    }

    // Format response for frontend
    const response = {
      courseId: attainmentResult.courseId,
      courseName: attainmentResult.courseName,
      courseCode: attainmentResult.courseCode,
      calculatedAt: attainmentResult.calculatedAt,
      settings: {
        coTarget: attainmentResult.targetPercentage,
        level1Threshold: attainmentResult.level1Threshold,
        level2Threshold: attainmentResult.level2Threshold,
        level3Threshold: attainmentResult.level3Threshold,
      },
      summary: {
        totalCOs: attainmentResult.coAttainments.length,
        totalStudents: attainmentResult.totalStudents,
        averageAttainment: attainmentResult.coAttainments.length > 0 
          ? attainmentResult.coAttainments.reduce((sum, co) => sum + co.percentageMeetingTarget, 0) / attainmentResult.coAttainments.length
          : 0,
        levelDistribution: {
          level0: attainmentResult.coAttainments.filter(co => co.attainmentLevel === 0).length,
          level1: attainmentResult.coAttainments.filter(co => co.attainmentLevel === 1).length,
          level2: attainmentResult.coAttainments.filter(co => co.attainmentLevel === 2).length,
          level3: attainmentResult.coAttainments.filter(co => co.attainmentLevel === 3).length,
        }
      },
      coAttainments: attainmentResult.coAttainments.map(co => ({
        coId: co.coId,
        coCode: co.coCode,
        coDescription: co.coDescription,
        targetPercentage: co.targetPercentage,
        attainedPercentage: co.percentageMeetingTarget,
        studentsAttained: co.studentsMeetingTarget,
        totalStudents: co.totalStudents,
        attainmentLevel: co.attainmentLevel,
        thresholds: {
          level1: co.level1Threshold,
          level2: co.level2Threshold,
          level3: co.level3Threshold,
        }
      })),
      studentAttainments: attainmentResult.studentAttainments.map(student => ({
        studentId: student.studentId,
        studentName: student.studentName,
        coId: student.coId,
        coCode: student.coCode,
        percentage: student.percentage,
        metTarget: student.metTarget,
        totalObtainedMarks: student.totalObtainedMarks,
        totalMaxMarks: student.totalMaxMarks,
        attemptedQuestions: student.attemptedQuestions,
        totalQuestions: student.totalQuestions
      }))
    };

    console.log(`✅ CO attainment calculation completed for course ${courseId}`);
    console.log(`📊 Summary: ${response.summary.totalCOs} COs, ${response.summary.totalStudents} students, avg attainment: ${response.summary.averageAttainment.toFixed(1)}%`);

    return NextResponse.json({
      message: 'CO attainments calculated successfully',
      data: response
    });

  } catch (error) {
    console.error('❌ Error calculating CO attainments:', error);
    return NextResponse.json(
      { error: 'Failed to calculate CO attainments' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;
    const { searchParams } = new URL(request.url);
    
    const academicYear = searchParams.get('academicYear') || undefined;
    const coId = searchParams.get('coId') || undefined;
    const studentId = searchParams.get('studentId') || undefined;

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

    let result;

    if (coId && studentId) {
      // Get specific student CO attainment from database
      result = await getStoredAttainments(courseId, academicYear);
      if (result) {
        // Filter for specific student and CO
        result.studentAttainments = result.studentAttainments.filter(
          (sa: any) => sa.studentId === studentId && sa.coId === coId
        );
      }
    } else if (coId) {
      // Get class CO attainment for specific CO from database
      result = await getStoredAttainments(courseId, academicYear);
      if (result) {
        // Filter for specific CO
        result.coAttainments = result.coAttainments.filter((co: any) => co.coId === coId);
        result.studentAttainments = result.studentAttainments.filter(
          (sa: any) => sa.coId === coId
        );
      }
    } else {
      // Get full course attainment from database
      result = await getStoredAttainments(courseId, academicYear);
    }
    
    // If no stored data, return empty result instead of calculating
    if (!result) {
      return NextResponse.json({
        courseId,
        courseName: 'Course',
        courseCode: 'COURSE',
        calculatedAt: new Date(),
        coAttainments: [],
        studentAttainments: [],
        summary: {
          totalCOs: 0,
          totalStudents: 0,
          averageAttainment: 0,
          levelDistribution: {
            level0: 0,
            level1: 0,
            level2: 0,
            level3: 0,
          }
        }
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching CO attainments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CO attainment data' },
      { status: 500 }
    );
  }
}