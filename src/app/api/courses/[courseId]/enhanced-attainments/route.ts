import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EnhancedCOAttainmentCalculator } from '@/lib/enhanced-co-attainment-calculator';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';

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
      force = false,
      sectionId,
      coId
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
        { error: 'Insufficient permissions to calculate enhanced CO attainments' },
        { status: 403 }
      );
    }

    console.log(`🚀 Starting Enhanced CO attainment calculation for course ${courseId} by user ${user.name}`);

    let result;

    if (sectionId && coId) {
      // Calculate for specific section and CO
      result = await EnhancedCOAttainmentCalculator.calculateSectionCOAttainment(
        courseId,
        coId,
        sectionId
      );
    } else if (coId) {
      // Calculate enhanced class CO attainment for specific CO
      result = await EnhancedCOAttainmentCalculator.calculateEnhancedClassCOAttainment(
        courseId,
        coId
      );
    } else {
      // Calculate enhanced class CO attainment for all COs
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

      const coAttainments = [];
      const allStudentAttainments = [];

      for (const co of course.courseOutcomes) {
        const classAttainment = await EnhancedCOAttainmentCalculator.calculateEnhancedClassCOAttainment(
          courseId,
          co.id
        );
        
        if (classAttainment) {
          coAttainments.push(classAttainment);
        }
      }

      result = {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        calculatedAt: new Date(),
        coAttainments,
        summary: {
          totalCOs: coAttainments.length,
          averageAttainment: coAttainments.length > 0 
            ? coAttainments.reduce((sum, co) => sum + co.averageAttainment, 0) / coAttainments.length
            : 0,
          weightedAverageAttainment: coAttainments.length > 0 
            ? coAttainments.reduce((sum, co) => sum + co.weightedAverageAttainment, 0) / coAttainments.length
            : 0,
          levelDistribution: {
            level0: coAttainments.filter(co => co.attainmentLevel === 0).length,
            level1: coAttainments.filter(co => co.attainmentLevel === 1).length,
            level2: coAttainments.filter(co => co.attainmentLevel === 2).length,
            level3: coAttainments.filter(co => co.attainmentLevel === 3).length,
          }
        }
      };
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to calculate enhanced CO attainments - no data found' },
        { status: 404 }
      );
    }

    // Save attainments to database if requested
    if (force) {
      try {
        // Note: Enhanced calculation results could be saved if needed
        // For now, we'll just log the save attempt
        console.log(`💾 Enhanced CO attainment calculation completed for course ${courseId}`);
      } catch (saveError) {
        console.error('❌ Error saving enhanced attainments:', saveError);
        // Continue even if save fails
      }
    }

    console.log(`✅ Enhanced CO attainment calculation completed for course ${courseId}`);

    return NextResponse.json({
      message: 'Enhanced CO attainments calculated successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error calculating enhanced CO attainments:', error);
    return NextResponse.json(
      { error: 'Failed to calculate enhanced CO attainments' },
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
    const sectionId = searchParams.get('sectionId') || undefined;

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

    if (sectionId && coId) {
      // Get specific section CO attainment
      result = await EnhancedCOAttainmentCalculator.calculateSectionCOAttainment(
        courseId,
        coId,
        sectionId
      );
    } else if (coId) {
      // Get enhanced class CO attainment for specific CO
      result = await EnhancedCOAttainmentCalculator.calculateEnhancedClassCOAttainment(
        courseId,
        coId
      );
    } else {
      // Get enhanced class CO attainment for all COs
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

      const coAttainments = [];
      const allStudentAttainments = [];

      for (const co of course.courseOutcomes) {
        const classAttainment = await EnhancedCOAttainmentCalculator.calculateEnhancedClassCOAttainment(
          courseId,
          co.id
        );
        
        if (classAttainment) {
          coAttainments.push(classAttainment);
        }
      }

      result = {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        calculatedAt: new Date(),
        coAttainments,
        summary: {
          totalCOs: coAttainments.length,
          averageAttainment: coAttainments.length > 0 
            ? coAttainments.reduce((sum, co) => sum + co.averageAttainment, 0) / coAttainments.length
            : 0,
          weightedAverageAttainment: coAttainments.length > 0 
            ? coAttainments.reduce((sum, co) => sum + co.weightedAverageAttainment, 0) / coAttainments.length
            : 0,
          levelDistribution: {
            level0: coAttainments.filter(co => co.attainmentLevel === 0).length,
            level1: coAttainments.filter(co => co.attainmentLevel === 1).length,
            level2: coAttainments.filter(co => co.attainmentLevel === 2).length,
            level3: coAttainments.filter(co => co.attainmentLevel === 3).length,
          }
        }
      };
    }

    if (!result) {
      return NextResponse.json(
        { error: 'No enhanced attainment data found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching enhanced CO attainment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enhanced CO attainment data' },
      { status: 500 }
    );
  }
}