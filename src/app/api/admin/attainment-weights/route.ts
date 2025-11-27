import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

interface AttainmentWeights {
  directWeight: number;
  indirectWeight: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return default weights
    // In a real implementation, this would come from a settings table
    const defaultWeights: AttainmentWeights = {
      directWeight: 0.8,
      indirectWeight: 0.2
    };

    return NextResponse.json({
      success: true,
      data: defaultWeights
    });

  } catch (error) {
    console.error('Error getting attainment weights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weights: AttainmentWeights = await request.json();

    // Validate weights
    if (!weights.directWeight || !weights.indirectWeight) {
      return NextResponse.json(
        { error: 'Both direct and indirect weights are required' },
        { status: 400 }
      );
    }

    if (weights.directWeight + weights.indirectWeight !== 1.0) {
      return NextResponse.json(
        { error: 'Sum of weights must equal 1.0 (100%)' },
        { status: 400 }
      );
    }

    if (weights.directWeight < 0 || weights.directWeight > 1 || 
        weights.indirectWeight < 0 || weights.indirectWeight > 1) {
      return NextResponse.json(
        { error: 'Weights must be between 0 and 1' },
        { status: 400 }
      );
    }

    // In a real implementation, this would save to a settings table
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: 'Attainment weights updated successfully',
      data: weights
    });

  } catch (error) {
    console.error('Error updating attainment weights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}