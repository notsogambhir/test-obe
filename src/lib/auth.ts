import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { AuthUser, DbUser, User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Role hierarchy for cascading permissions (higher number = higher privilege)
// Note: STUDENT is explicitly excluded from hierarchy as it's not an administrative role
export const ROLE_HIERARCHY = {
  'ADMIN': 50,
  'UNIVERSITY': 40,
  'DEPARTMENT': 30,
  'PROGRAM_COORDINATOR': 20,
  'TEACHER': 10,
} as const;

// Type for administrative roles (excluding STUDENT)
type AdministrativeRole = keyof typeof ROLE_HIERARCHY;

export type { AuthUser };

export function transformDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email || '',
    name: dbUser.name,
    role: dbUser.role,
    collegeId: dbUser.collegeId || undefined,
    programId: dbUser.programId || undefined,
    batchId: dbUser.batchId || undefined,
  };
}

export function transformDbUserToAuthUser(dbUser: DbUser): AuthUser {
  return {
    id: dbUser.id,
    email: dbUser.email || '',
    name: dbUser.name,
    role: dbUser.role,
    collegeId: dbUser.collegeId,
    programId: dbUser.programId,
    batchId: dbUser.batchId,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User | AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      collegeId: user.collegeId,
      programId: user.programId,
      batchId: user.batchId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  // First try to get from Authorization header (for cross-origin requests)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fall back to cookies (for same-origin requests)
  return request.cookies.get('auth-token')?.value || null;
}

export async function authenticateUser(email: string, password: string, collegeId?: string): Promise<User | null> {
  const user = await db.user.findUnique({
    where: { email },
    include: {
      college: true,
      program: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  // Validate college for department role and non-admin roles
  // Admin users can access any college, so don't validate collegeId for them
  if (user.role !== 'ADMIN' && collegeId && user.collegeId !== collegeId) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return null;
  }

  return transformDbUserToUser(user);
}

/**
 * Check if a user has the required role or higher in the administrative hierarchy
 * @param userRole - The current user's role
 * @param requiredRole - The minimum required role for access
 * @returns true if user has required role or higher, false otherwise
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  // If either role is STUDENT, cascading logic does not apply
  if (userRole === 'STUDENT' || requiredRole === 'STUDENT') {
    return false; // STUDENT role is excluded from administrative hierarchy entirely
  }
  
  // Check if both roles are in the administrative hierarchy
  const userLevel = ROLE_HIERARCHY[userRole as AdministrativeRole];
  const requiredLevel = ROLE_HIERARCHY[requiredRole as AdministrativeRole];
  
  // If either role is not in hierarchy, return false
  if (userLevel === undefined || requiredLevel === undefined) {
    return false;
  }
  
  // User has access if their level is equal to or higher than required
  return userLevel >= requiredLevel;
}