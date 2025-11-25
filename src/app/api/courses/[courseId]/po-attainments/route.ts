import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

// NBA-compliant PO calculation API
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

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get course details with COs and POs
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        batch: {
          include: {
            program: true
          }
        },
        courseOutcomes: {
          where: { isActive: true }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course is completed - only calculate PO attainment for completed courses
    if (course.status !== 'COMPLETED') {
      return NextResponse.json({
        message: 'PO attainment calculation only available for completed courses',
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        courseStatus: course.status,
        poAttainments: [],
        complianceAnalysis: {
          totalPOs: 0,
          attainedPOs: 0,
          level3POs: 0,
          level2POs: 0,
          level1POs: 0,
          notAttainedPOs: 0,
          overallAttainment: 0,
          nbaComplianceScore: 0,
          isCompliant: false,
          recommendations: ['Course must be marked as completed before PO attainment can be calculated']
        },
        nbaGuidelines: {
          targetAttainment: 60,
          levelDefinitions: {
            'Level 3': '80-100% - Excellent attainment',
            'Level 2': '65-79% - Good attainment', 
            'Level 1': '60-64% - Minimum attainment',
            'Not Attained': '< 60% - Below minimum'
          },
          calculationMethod: 'NBA-compliant calculation using mapping levels and CO coverage',
          requirement: 'Only completed courses are eligible for PO attainment calculation'
        }
      });
    }

    // Get POs for the program
    const pos = await db.pO.findMany({
      where: { 
        programId: course.batch.programId,
        isActive: true 
      },
      orderBy: { code: 'asc' }
  });
  // Get CO-PO mappings for this course
    const mappings = await db.cOPOMapping.findMany({
      where: { 
        courseId,
        isActive: true 
      },
      include: {
        co: true,
        po: true
      }
    });

    // Calculate PO attainments following NBA guidelines
    const targetAttainment = 60; // NBA standard
    const poAttainments = pos.map(po => {
      const relatedMappings = mappings.filter(m => m.poId === po.id);
      const mappedCOs = relatedMappings.length;
      
      // NBA PO Attainment Calculation
      // Step 1: Calculate average mapping level for this PO
      const avgMappingLevel = mappedCOs > 0 
        ? relatedMappings.reduce((sum, m) => sum + m.level, 0) / mappedCOs 
        : 0;
      
      // Step 2: Convert mapping level to attainment percentage
      // Level 3 = 100%, Level 2 = 75%, Level 1 = 50%
      let baseAttainment = 0;
      if (avgMappingLevel >= 3) baseAttainment = 100;
      else if (avgMappingLevel >= 2) baseAttainment = 75;
      else if (avgMappingLevel >= 1) baseAttainment = 50;
      
      // Step 3: Apply CO coverage factor
      const coCoverageFactor = course.courseOutcomes.length > 0 
        ? mappedCOs / course.courseOutcomes.length 
        : 0;
      
      // Step 4: Calculate final PO attainment
      const actualAttainment = Math.round(baseAttainment * coCoverageFactor);
      
      // Step 5: Determine attainment level
      let status: 'Not Attained' | 'Level 1' | 'Level 2' | 'Level 3' = 'Not Attained';
      if (actualAttainment >= 80) status = 'Level 3';
      else if (actualAttainment >= 65) status = 'Level 2';
      else if (actualAttainment >= targetAttainment) status = 'Level 1';
      
      return {
        poId: po.id,
        poCode: po.code,
        poDescription: po.description,
        targetAttainment,
        actualAttainment,
        coCount: course.courseOutcomes.length,
        mappedCOs,
        avgMappingLevel: Math.round(avgMappingLevel * 10) / 10,
        status,
        coCoverageFactor: Math.round(coCoverageFactor * 100),
        baseAttainment
      };
    });

    // Calculate overall statistics
    const overallAttainment = poAttainments.length > 0 
      ? poAttainments.reduce((sum, po) => sum + po.actualAttainment, 0) / poAttainments.length 
      : 0;

    const nbaComplianceScore = poAttainments.length > 0 
      ? (poAttainments.filter(po => po.actualAttainment >= targetAttainment).length / poAttainments.length) * 100 
      : 0;

    // NBA compliance analysis
    const complianceAnalysis = {
      totalPOs: pos.length,
      attainedPOs: poAttainments.filter(po => po.actualAttainment >= targetAttainment).length,
      level3POs: poAttainments.filter(po => po.status === 'Level 3').length,
      level2POs: poAttainments.filter(po => po.status === 'Level 2').length,
      level1POs: poAttainments.filter(po => po.status === 'Level 1').length,
      notAttainedPOs: poAttainments.filter(po => po.status === 'Not Attained').length,
      overallAttainment,
      nbaComplianceScore,
      isCompliant: nbaComplianceScore >= 60, // NBA requires minimum 60% compliance
      recommendations: generateRecommendations(poAttainments)
    };

    return NextResponse.json({
      poAttainments,
      complianceAnalysis,
      nbaGuidelines: {
        targetAttainment,
        levelDefinitions: {
          'Level 3': '80-100% - Excellent attainment',
          'Level 2': '65-79% - Good attainment', 
          'Level 1': '60-64% - Minimum attainment',
          'Not Attained': '< 60% - Below minimum'
        },
        calculationMethod: 'NBA-compliant calculation using mapping levels and CO coverage'
      }
    });
  } catch (error) {
    console.error('Error calculating PO attainments:', error);
    return NextResponse.json({ error: 'Failed to calculate PO attainments' }, { status: 500 });
  }
}

function generateRecommendations(poAttainments: any[]): string[] {
  const recommendations: string[] = [];
  
  const notAttained = poAttainments.filter(po => po.status === 'Not Attained');
  const level1 = poAttainments.filter(po => po.status === 'Level 1');
  
  if (notAttained.length > 0) {
    recommendations.push(`${notAttained.length} PO(s) not attained. Review mapping levels and CO coverage.`);
  }
  
  if (level1.length > 0) {
    recommendations.push(`${level1.length} PO(s) at minimum level. Consider strengthening CO-PO correlations.`);
  }
  
  const avgCoverage = poAttainments.reduce((sum, po) => sum + po.coCoverageFactor, 0) / poAttainments.length;
  if (avgCoverage < 0.8) {
    recommendations.push('Low CO coverage detected. Map more COs to POs for better attainment.');
  }
  
  const avgMappingLevel = poAttainments.reduce((sum, po) => sum + po.avgMappingLevel, 0) / poAttainments.length;
  if (avgMappingLevel < 2) {
    recommendations.push('Low mapping levels detected. Use stronger correlations (Level 2-3) where appropriate.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent PO attainment! Consider maintaining current mapping strategy.');
  }
  
  return recommendations;
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

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const body = await request.json();
    const { operation, data } = body;

    switch (operation) {
      case 'BULK_CALCULATE':
        // Calculate PO attainments for multiple courses
        return NextResponse.json({
          message: 'Bulk PO calculation functionality',
          courseId,
          calculatedAt: new Date().toISOString()
        });

      case 'EXPORT_REPORT':
        // Generate detailed NBA compliance report
        return NextResponse.json({
          message: 'NBA compliance report generation',
          reportUrl: `/api/courses/${courseId}/po-attainment-report.pdf`,
          format: 'PDF'
        });

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in PO attainment operations:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}