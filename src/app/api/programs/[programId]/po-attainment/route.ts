import { NextRequest, NextResponse } from 'next/server';
import { POAttainmentCalculator } from '@/lib/po-attainment-calculator';
import { getUserFromRequest } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    // Get authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🎯 API: Calculating PO attainment for program: ${programId}`);

    // Use the corrected PO Attainment Calculator
    const result = await POAttainmentCalculator.calculateProgramPOAttainment(programId);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to calculate PO attainment' },
        { status: 500 }
      );
    }

    console.log(`✅ API: PO attainment calculation completed for program: ${programId}`);
    console.log(`📊 API Summary: ${result.overallAttainment}% overall, ${result.nbaComplianceScore}% NBA compliance`);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ API Error calculating PO Attainment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'PROGRAM_COORDINATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { programId, options } = await request.json();

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 API: Recalculating PO attainment for program: ${programId}`);

    // Use the corrected PO Attainment Calculator with options
    const result = await POAttainmentCalculator.calculateProgramPOAttainment(programId, options);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to calculate PO attainment' },
        { status: 500 }
      );
    }

    console.log(`✅ API: PO attainment recalculation completed for program: ${programId}`);

    return NextResponse.json({
      success: true,
      message: 'PO attainment recalculated successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ API Error recalculating PO Attainment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}