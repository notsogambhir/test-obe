import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const programId = searchParams.get('programId');

    // In a real implementation, this would query an audit trail table
    // For now, we'll return a mock response
    const auditTrail = [
      {
        id: '1',
        batchId: batchId || 'batch1',
        programId: programId || 'program1',
        calculationType: 'PO_ATTAINMENT',
        calculatedBy: user.name,
        calculatedAt: new Date().toISOString(),
        snapshot: {
          directWeight: 0.8,
          indirectWeight: 0.2,
          poAttainments: [
            { poCode: 'PO1', finalAttainment: 2.15, targetLevel: 2.0 },
            { poCode: 'PO2', finalAttainment: 1.95, targetLevel: 2.0 }
          ]
        },
        status: 'FINALIZED'
      }
    ];

    return NextResponse.json({
      success: true,
      data: auditTrail
    });

  } catch (error) {
    console.error('Error fetching audit trail:', error);
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

    const { batchId, programId, calculationData } = await request.json();

    if (!batchId || !programId || !calculationData) {
      return NextResponse.json(
        { error: 'Batch ID, Program ID, and calculation data are required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would save to an audit trail table
    const auditEntry = {
      id: Date.now().toString(),
      batchId,
      programId,
      calculationType: 'PO_ATTAINMENT',
      calculatedBy: user.name,
      calculatedAt: new Date().toISOString(),
      snapshot: calculationData,
      status: 'FINALIZED'
    };

    return NextResponse.json({
      success: true,
      message: 'Calculation snapshot saved successfully',
      data: auditEntry
    });

  } catch (error) {
    console.error('Error saving audit trail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}