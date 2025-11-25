import { NextRequest, NextResponse } from 'next/server';
import { POAttainmentCalculator } from '@/lib/po-attainment-calculator';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';
import { CourseStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const resolvedParams = await params;
    const batchId = resolvedParams.batchId;

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
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
        { error: 'Insufficient permissions to view batch PO attainment' },
        { status: 403 }
      );
    }

    console.log(`🔍 API: Fetching PO attainment for batch: ${batchId}`);

    // Calculate PO attainment for batch
    const url = new URL(request.url);
    const courseStatusParam = url.searchParams.get('courseStatus');
    let courseStatuses: CourseStatus[] | undefined;
    
    // Parse course status parameter if provided
    if (courseStatusParam) {
      courseStatuses = courseStatusParam.split(',').map(status => status.trim() as CourseStatus);
    }
    
    const poAttainmentResult = await POAttainmentCalculator.calculateBatchPOAttainment(
      batchId,
      {
        academicYear: url.searchParams.get('academicYear') || undefined,
        includeInactiveCourses: false,
        courseStatus: courseStatuses
      }
    );

    if (!poAttainmentResult) {
      return NextResponse.json(
        { error: 'Failed to calculate batch PO attainment' },
        { status: 404 }
      );
    }

    console.log(`📊 API: Batch PO attainment calculated for batch ${batchId}`, {
      overallAttainment: poAttainmentResult.overallAttainment,
      nbaComplianceScore: poAttainmentResult.nbaComplianceScore,
      totalPOs: poAttainmentResult.totalPOs,
      isCompliant: poAttainmentResult.isCompliant
    });

    return NextResponse.json({
      message: 'Batch PO attainment calculated successfully',
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
        complianceCriteria: 'Minimum 60% of POs must meet target attainment for NBA compliance',
        scope: 'Batch-specific PO attainment using only courses from this batch'
      },
      recommendations: POAttainmentCalculator.generateRecommendations(poAttainmentResult.poAttainments)
    });

  } catch (error) {
    console.error('❌ API Error calculating batch PO attainment:', error);
    return NextResponse.json(
      { error: 'Failed to calculate batch PO attainment' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const resolvedParams = await params;
    const batchId = resolvedParams.batchId;
    const body = await request.json();
    const { operation } = body;

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
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
        { error: 'Insufficient permissions to calculate batch PO attainment' },
        { status: 403 }
      );
    }

    console.log(`🔄 API: Batch PO operation requested for batch: ${batchId}`, { operation });

    switch (operation) {
      case 'RECALCULATE':
        // Force recalculation of batch PO attainments
        const courseStatuses = body.courseStatus as CourseStatus[] | undefined;
        const poAttainmentResult = await POAttainmentCalculator.calculateBatchPOAttainment(
          batchId,
          {
            academicYear: body.academicYear,
            includeInactiveCourses: body.includeInactiveCourses || false,
            courseStatus: courseStatuses
          }
        );

        if (!poAttainmentResult) {
          return NextResponse.json(
            { error: 'Failed to recalculate batch PO attainment' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          message: 'Batch PO attainment recalculated successfully',
          data: poAttainmentResult,
          calculatedAt: new Date().toISOString()
        });

      case 'EXPORT_REPORT':
        // Generate detailed NBA compliance report for this batch
        return NextResponse.json({
          message: 'Batch NBA compliance report generation',
          reportUrl: `/api/batches/${batchId}/po-attainment-report.pdf`,
          format: 'PDF',
          batchId,
          generatedAt: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ API Error in batch PO attainment operations:', error);
    return NextResponse.json(
      { error: 'Failed to process batch PO attainment request' },
      { status: 500 }
    );
  }
}