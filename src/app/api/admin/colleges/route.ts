import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const colleges = await db.college.findMany({
      include: {
        _count: {
          select: {
            programs: true,
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(colleges);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, code, description } = await request.json();

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if college with same name or code already exists
    const existingCollege = await db.college.findFirst({
      where: {
        OR: [
          { name: name },
          { code: code }
        ]
      }
    });

    if (existingCollege) {
      return NextResponse.json(
        { error: 'College with this name or code already exists' },
        { status: 409 }
      );
    }

    const college = await db.college.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
      },
      include: {
        programs: true,
        users: true
      }
    });

    return NextResponse.json(college, { status: 201 });
  } catch (error) {
    console.error('Error creating college:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}