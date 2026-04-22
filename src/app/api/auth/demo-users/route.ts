import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const users = await db.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        collegeId: true,
        college: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    const demoUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      collegeId: user.collegeId,
      collegeCode: user.college?.code || null,
      collegeName: user.college?.name || null,
    }));

    return NextResponse.json(demoUsers);
  } catch (error) {
    console.error('Failed to fetch demo users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demo users' },
      { status: 500 }
    );
  }
}
