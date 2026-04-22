import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { AuthUser, DbUser, User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET;
const IS_PROD = process.env.NODE_ENV === 'production';

if (!JWT_SECRET) {
  if (IS_PROD) {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable is not defined in production.');
  }
  console.warn('⚠️ WARNING: JWT_SECRET is not defined. Using insecure default for development only.');
}

const SECRET_KEY = JWT_SECRET || 'your-secret-key';




export type { AuthUser };

export function transformDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email || '',
    name: dbUser.name,
    role: dbUser.role,
    collegeId: dbUser.collegeId || undefined,
    programId: dbUser.programId || undefined,
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
    },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as AuthUser;
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
