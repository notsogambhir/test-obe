import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, collegeId } = await request.json();
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('College ID:', collegeId);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password, collegeId);

    if (!user) {
      console.log('Authentication failed for:', email);
      return NextResponse.json(
        { error: 'Invalid credentials or college access denied' },
        { status: 401 }
      );
    }

    console.log('Authentication successful for user:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      collegeId: user.collegeId,
      programId: user.programId
    });

    try {
      const token = generateToken({
        id: user.id,
        email: user.email || '',
        name: user.name,
        role: user.role,
        collegeId: user.collegeId || null,
        programId: user.programId || null,
        batchId: user.batchId || null,
      });
      console.log('Generated token (first 20 chars):', token.substring(0, 20) + '...');

      const response = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          collegeId: user.collegeId,
          programId: user.programId,
        },
        token,
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      console.log('Cookie set in response');
      console.log('About to return response...');
      return response;
    } catch (tokenError) {
      console.error('Error during token/response generation:', tokenError);
      return NextResponse.json(
        { error: 'Token generation failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}