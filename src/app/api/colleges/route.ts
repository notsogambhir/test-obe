import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Optimized GET /api/colleges - Add caching and reduce data transfer
export async function GET() {
  try {
    console.log('GET /api/colleges called (OPTIMIZED)');
    
    const colleges = await db.college.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true
        // Remove description to reduce payload size
      },
      orderBy: { name: 'asc' },
      take: 20 // Limit to prevent timeout
    });

    console.log(`Found ${colleges.length} colleges`);
    return NextResponse.json(colleges);
    
  } catch (error) {
    console.error('Error fetching colleges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colleges' },
      { status: 500 }
    );
  }
}