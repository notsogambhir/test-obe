// Database User type (matches Prisma schema)
export interface DbUser {
  id: string;
  email: string | null;
  employeeId: string | null;
  password: string;
  name: string;
  role: string;
  collegeId: string | null;
  programId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Auth User type (for authentication)
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId: string | null;
  programId: string | null;
}

// Component User type (for frontend components)
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId?: string;
  programId?: string;
}