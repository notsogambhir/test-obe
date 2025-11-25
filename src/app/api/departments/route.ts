import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Since we don't have departments in the schema, we'll return colleges as departments
    // This maintains compatibility with the frontend while working with our current schema
    const colleges = await db.college.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform colleges to department format
    const departments = colleges.map(college => ({
      id: college.id,
      name: college.name,
      code: college.code,
      description: college.description
    }));

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}