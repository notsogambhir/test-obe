import { NextRequest } from 'next/server';
import { verifyToken } from './auth';
import { logger } from './logger';
import { AuthUser } from '@/types/user';

export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  // First try to get token from Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      return decoded;
    } catch (error) {
      logger.error('Failed to verify Bearer token:', { error: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  // Fallback to cookie-based authentication
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    logger.info('No authentication token found in header or cookies');
    return null;
  }

  try {
    const user = verifyToken(token);
    if (!user) {
      logger.info('No user found in token');
      return null;
    }
    logger.info('User authenticated via cookie:', {
      metadata: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
    return user;
  } catch (error) {
    logger.error('Failed to verify cookie token:', { error: error instanceof Error ? error : new Error(String(error)) });
    return null;
  }
}

export function canCreateCourse(user: AuthUser | null | undefined): boolean {
  return !!user && ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR'].includes(user.role || '');
}