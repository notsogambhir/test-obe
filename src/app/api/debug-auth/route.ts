import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    console.log('=== DEBUG AUTH ENDPOINT CALLED ===');
    console.log('Token present:', !!token);
    console.log('All cookies:', request.cookies.getAll());

    if (!token) {
      console.log('No token found');
      return NextResponse.json({ 
        debug: 'No token found',
        cookies: request.cookies.getAll()
      });
    }

    const user = verifyToken(token);
    
    console.log('User from token:', user);
    
    if (!user) {
      console.log('Token verification failed');
      return NextResponse.json({ 
        debug: 'Token verification failed',
        tokenPresent: !!token
      });
    }

    console.log('User details:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      collegeId: user.collegeId,
      programId: user.programId
    });

    return NextResponse.json({ 
      debug: 'User found',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        collegeId: user.collegeId,
        programId: user.programId
      }
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({ 
      debug: 'Error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}