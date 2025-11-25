import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    
    console.log('Auth /me endpoint called');
    console.log('Token present:', !!token);

    if (!token) {
      console.log('No token found in /api/auth/me');
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    
    console.log('User from token in /api/auth/me:', user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      collegeId: user.collegeId,
      programId: user.programId
    } : 'null');

    if (!user) {
      console.log('Token verification failed in /api/auth/me');
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log('Returning user data from /api/auth/me');
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}