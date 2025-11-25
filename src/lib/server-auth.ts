import { NextRequest } from 'next/server';
import { verifyToken } from './auth';

export async function getUserFromRequest(request: NextRequest) {
  // First try to get token from Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      return decoded;
    } catch (error) {
      console.error('Failed to verify Bearer token:', error);
    }
  }

  // Fallback to cookie-based authentication
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    console.log('No authentication token found in header or cookies');
    return null;
  }

  try {
    const user = verifyToken(token);
    if (!user) {
      console.log('No user found in token');
      return null;
    }
    console.log('User authenticated via cookie:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    return user;
  } catch (error) {
    console.error('Failed to verify cookie token:', error);
    return null;
  }
}

export function canCreateCourse(user: any) {
  return user && ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR'].includes(user.role);
}