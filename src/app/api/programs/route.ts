import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

// Optimized GET /api/programs - Add query limits and reduce data transfer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get('collegeId');
    
    console.log('GET /api/programs called (OPTIMIZED)');
    
    const whereClause = collegeId ? { collegeId, isActive: true } : { isActive: true };
    
    // Simplified query with only essential fields
    const programs = await db.program.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        duration: true,
        collegeId: true
        // Remove expensive includes for now
      },
      orderBy: { name: 'asc' },
      take: 50 // Limit to prevent timeout
    });

    console.log(`Found ${programs.length} programs`);
    return NextResponse.json(programs);
    
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}