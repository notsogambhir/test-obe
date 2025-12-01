import { AuthUser } from './auth';

export enum Permission {
  // Batch permissions
  CREATE_BATCH = 'CREATE_BATCH',
  VIEW_BATCHES = 'VIEW_BATCHES',
  MANAGE_BATCH = 'MANAGE_BATCH',
  
  // Course permissions
  CREATE_COURSE = 'CREATE_COURSE',
  VIEW_COURSES = 'VIEW_COURSES',
  MANAGE_COURSE = 'MANAGE_COURSE',
  
  // Faculty permissions
  CREATE_FACULTY = 'CREATE_FACULTY',
  VIEW_FACULTY = 'VIEW_FACULTY',
  MANAGE_FACULTY = 'MANAGE_FACULTY',
  
  // Admin permissions
  MANAGE_COLLEGES = 'MANAGE_COLLEGES',
  MANAGE_DEPARTMENTS = 'MANAGE_DEPARTMENTS',
  MANAGE_PROGRAMS = 'MANAGE_PROGRAMS',
  MANAGE_USERS = 'MANAGE_USERS',
}

export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false;
  
  const { role } = user;
  
  switch (permission) {
    // Batch permissions - only admin, university, and department roles
    case Permission.CREATE_BATCH:
    case Permission.MANAGE_BATCH:
      return ['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(role);
    
    case Permission.VIEW_BATCHES:
      return ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR'].includes(role);
    
    // Course permissions - program coordinator can create in their batch, admin/university/department can manage all
    case Permission.CREATE_COURSE:
      return ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR'].includes(role);
    
    case Permission.MANAGE_COURSE:
      return ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR'].includes(role);
    
    case Permission.VIEW_COURSES:
      return ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR', 'TEACHER'].includes(role);
    
    // Faculty permissions
    case Permission.CREATE_FACULTY:
    case Permission.MANAGE_FACULTY:
      return ['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(role);
    
    case Permission.VIEW_FACULTY:
      return ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR'].includes(role);
    
    // Admin permissions
    case Permission.MANAGE_COLLEGES:
      return ['ADMIN', 'UNIVERSITY'].includes(role);
    
    case Permission.MANAGE_DEPARTMENTS:
      return ['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(role);
    
    case Permission.MANAGE_PROGRAMS:
      return ['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(role);
    
    case Permission.MANAGE_USERS:
      return ['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(role);
    
    default:
      return false;
  }
}

export function canCreateBatch(user: AuthUser | null): boolean {
  return hasPermission(user, Permission.CREATE_BATCH);
}

export function canCreateCourse(user: AuthUser | null): boolean {
  return hasPermission(user, Permission.CREATE_COURSE);
}

export function canManageCourse(user: AuthUser | null): boolean {
  return hasPermission(user, Permission.MANAGE_COURSE);
}

export function canCreateFaculty(user: AuthUser | null): boolean {
  return hasPermission(user, Permission.CREATE_FACULTY);
}

export function canManageFaculty(user: AuthUser | null): boolean {
  return hasPermission(user, Permission.MANAGE_FACULTY);
}

export function canManageCollege(user: AuthUser | null): boolean {
  return hasPermission(user, Permission.MANAGE_COLLEGES);
}

export function canManageDepartment(user: AuthUser | null): boolean {
  return hasPermission(user, Permission.MANAGE_DEPARTMENTS);
}

export function canManageProgram(user: AuthUser | null): boolean {
  return hasPermission(user, Permission.MANAGE_PROGRAMS);
}

export function canManageCollegeResources(user: AuthUser | null, collegeId?: string): boolean {
  if (!user) return false;
  
  // Admin and University can manage all colleges
  if (['ADMIN', 'UNIVERSITY'].includes(user.role)) return true;
  
  // Department users can only manage their own college
  if (user.role === 'DEPARTMENT' && collegeId && user.collegeId === collegeId) {
    return true;
  }
  
  return false;
}

export function canAccessCollege(user: AuthUser | null, collegeId?: string): boolean {
  if (!user) return false;
  
  // Admin and University can access all colleges
  if (['ADMIN', 'UNIVERSITY'].includes(user.role)) return true;
  
  // Department users can only access their own college
  if (user.role === 'DEPARTMENT' && collegeId && user.collegeId === collegeId) {
    return true;
  }
  
  // Other roles can access if they belong to the college
  if (collegeId && user.collegeId === collegeId) {
    return true;
  }
  
  return false;
}

export async function canTeacherManageCourse(teacherId: string, courseId: string, sectionId?: string): Promise<boolean> {
  try {
    const { db } = await import('./db');
    
    // Check if teacher is assigned to this course/section
    const assignment = await db.teacherAssignment.findFirst({
      where: {
        teacherId,
        courseId,
        ...(sectionId && { sectionId }),
        isActive: true
      }
    });

    return !!assignment;
  } catch (error) {
    console.error('Error checking teacher course access:', error);
    return false;
  }
}