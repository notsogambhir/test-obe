import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const assignments = await db.teacherAssignment.findMany({
      include: {
        course: {
          select: {
            code: true,
            name: true
          }
        },
        teacher: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({
      count: assignments.length,
      assignments: assignments
    });
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}