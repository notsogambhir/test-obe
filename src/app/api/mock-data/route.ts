import { NextRequest, NextResponse } from 'next/server';
import { MockDataGenerator } from '@/lib/mock-data-generator';
import { getUserFromRequest } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Only admins can generate mock data
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only ADMIN users can generate mock data.' 
      }, { status: 403 });
    }

    console.log('🚀 Starting mock data generation from API...');

    const body = await request.json();
    const { operation } = body;

    switch (operation) {
      case 'GENERATE_ALL': {
        const mockResult = await MockDataGenerator.generateAllMockData();
        const summary = `Generated ${mockResult.colleges} colleges, ${mockResult.programs} programs, ${mockResult.batches} batches, ${mockResult.students} students, ${mockResult.courses} courses, ${mockResult.pos} POs, ${mockResult.cos} COs, ${mockResult.coPOMappings} CO-PO mappings, ${mockResult.users} users, ${mockResult.enrollments} enrollments`;
        return NextResponse.json({
          message: 'Mock data generated successfully',
          data: mockResult,
          summary
        });
      }

      case 'CLEAN_AND_REGENERATE': {
        const cleanResult = await MockDataGenerator.cleanAndRegenerate();
        const cleanSummary = `Regenerated ${cleanResult.colleges} colleges, ${cleanResult.programs} programs, ${cleanResult.batches} batches, ${cleanResult.students} students, ${cleanResult.courses} courses, ${cleanResult.pos} POs, ${cleanResult.cos} COs, ${cleanResult.coPOMappings} CO-PO mappings, ${cleanResult.users} users, ${cleanResult.enrollments} enrollments`;
        return NextResponse.json({
          message: 'Existing data cleaned and new mock data generated',
          data: cleanResult,
          summary: cleanSummary
        });
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid operation. Use GENERATE_ALL or CLEAN_AND_REGENERATE.' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in mock data generation API:', error);
    return NextResponse.json(
      { error: 'Failed to generate mock data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only ADMIN users can access mock data generation.' 
      }, { status: 403 });
    }

    return NextResponse.json({
      message: 'Mock Data Generation API',
      endpoints: {
        'POST /api/mock-data': 'Generate or regenerate mock data',
        operations: {
          'GENERATE_ALL': 'Generate comprehensive mock data',
          'CLEAN_AND_REGENERATE': 'Clean existing data and regenerate'
        },
        usage: {
          generateAll: 'POST with { operation: "GENERATE_ALL" }',
          cleanAndRegenerate: 'POST with { operation: "CLEAN_AND_REGENERATE" }'
        }
      }
    });
  } catch (error) {
    console.error('❌ Error in mock data generation API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}