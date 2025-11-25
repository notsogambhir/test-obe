import { NextRequest, NextResponse } from 'next/server';
import { POAttainmentCalculator } from '@/lib/po-attainment-calculator';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';
import { CourseStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    const resolvedParams = await params;
    const programId = resolvedParams.programId;

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Check permissions
    const canView = ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR'].includes(user?.role || '');
    if (!canView) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view PO attainment' },
        { status: 403 }
      );
    }

    console.log(`🔍 API: Fetching PO attainment for program: ${programId}`);

    // Calculate PO attainment for the program
    const url = new URL(request.url);
    const courseStatusParam = url.searchParams.get('courseStatus');
    let courseStatuses: CourseStatus[] | undefined;
    
    // Parse course status parameter if provided
    if (courseStatusParam) {
      courseStatuses = courseStatusParam.split(',').map(status => status.trim() as CourseStatus);
    }
    
    const poAttainmentResult = await POAttainmentCalculator.calculateProgramPOAttainment(
      programId,
      {
        academicYear: url.searchParams.get('academicYear') || undefined,
        includeInactiveCourses: false,
        courseStatus: courseStatuses
      }
    );

    if (!poAttainmentResult) {
      return NextResponse.json(
        { error: 'Failed to calculate PO attainment' },
        { status: 404 }
      );
    }

    console.log(`📊 API: PO attainment calculated for program ${programId}`, {
      overallAttainment: poAttainmentResult.overallAttainment,
      nbaComplianceScore: poAttainmentResult.nbaComplianceScore,
      totalPOs: poAttainmentResult.totalPOs,
      isCompliant: poAttainmentResult.isCompliant
    });

    return NextResponse.json({
      message: 'PO attainment calculated successfully',
      data: poAttainmentResult,
      nbaGuidelines: {
        targetAttainment: poAttainmentResult.targetAttainment,
        levelDefinitions: {
          'Level 3': '80-100% - Excellent attainment',
          'Level 2': '65-79% - Good attainment', 
          'Level 1': '60-64% - Minimum attainment',
          'Not Attained': '< 60% - Below minimum'
        },
        calculationMethod: 'NBA-compliant calculation using CO-PO mapping levels and CO coverage factors',
        complianceCriteria: 'Minimum 60% of POs must meet target attainment for NBA compliance'
      },
      recommendations: POAttainmentCalculator.generateRecommendations(poAttainmentResult.poAttainments)
    });

  } catch (error) {
    console.error('❌ API Error calculating PO attainment:', error);
    return NextResponse.json(
      { error: 'Failed to calculate PO attainment' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    const resolvedParams = await params;
    const programId = resolvedParams.programId;
    const body = await request.json();
    const { operation } = body;

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Only Program Coordinators and above can trigger calculations
    if (!canCreateCourse(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to calculate PO attainment' },
        { status: 403 }
      );
    }

    console.log(`🔄 API: PO operation requested for program: ${programId}`, { operation });

    switch (operation) {
      case 'RECALCULATE':
        // Force recalculation of PO attainments
        const courseStatuses = body.courseStatus as CourseStatus[] | undefined;
        const poAttainmentResult = await POAttainmentCalculator.calculateProgramPOAttainment(
          programId,
          {
            academicYear: body.academicYear,
            includeInactiveCourses: body.includeInactiveCourses || false,
            courseStatus: courseStatuses
          }
        );

        if (!poAttainmentResult) {
          return NextResponse.json(
            { error: 'Failed to recalculate PO attainment' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          message: 'PO attainment recalculated successfully',
          data: poAttainmentResult,
          calculatedAt: new Date().toISOString()
        });

      case 'EXPORT_REPORT':
        // Generate detailed NBA compliance report
        return NextResponse.json({
          message: 'NBA compliance report generation',
          reportUrl: `/api/programs/${programId}/po-attainment-report.pdf`,
          format: 'PDF',
          generatedAt: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ API Error in PO attainment operations:', error);
    return NextResponse.json(
      { error: 'Failed to process PO attainment request' },
      { status: 500 }
    );
  }
}