import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get CO-PO mappings for the specific course
    const mappings = await db.cOPOMapping.findMany({
      where: { 
        courseId,
        isActive: true 
      },
      include: {
        co: {
          select: {
            id: true,
            code: true,
            description: true,
          }
        },
        po: {
          select: {
            id: true,
            code: true,
            description: true,
          }
        }
      },
      orderBy: [
        { co: { code: 'asc' } },
        { po: { code: 'asc' } }
      ],
    });

    return NextResponse.json(mappings);
  } catch (error) {
    console.error('Error fetching CO-PO mappings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CO-PO mappings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, coId, poId, level } = body;

    if (!courseId || !coId || !poId || level === undefined) {
      return NextResponse.json(
        { error: 'Course ID, CO ID, PO ID, and level are required' },
        { status: 400 }
      );
    }

    if (level < 0 || level > 3) {
      return NextResponse.json(
        { error: 'Level must be between 0 and 3' },
        { status: 400 }
      );
    }

    // Check if mapping already exists
    const existingMapping = await db.cOPOMapping.findUnique({
      where: {
        coId_poId_courseId: {
          coId,
          poId,
          courseId
        }
      }
    });

    let mapping;
    if (existingMapping) {
      // Update existing mapping
      mapping = await db.cOPOMapping.update({
        where: {
          coId_poId_courseId: {
            coId,
            poId,
            courseId
          }
        },
        data: { level, isActive: level > 0 }
      });
    } else {
      // Create new mapping
      mapping = await db.cOPOMapping.create({
        data: {
          courseId,
          coId,
          poId,
          level,
          isActive: level > 0
        }
      });
    }

    return NextResponse.json(mapping, { status: 201 });
  } catch (error) {
    console.error('Error creating CO-PO mapping:', error);
    return NextResponse.json(
      { error: 'Failed to create CO-PO mapping' },
      { status: 500 }
    );
  }
}