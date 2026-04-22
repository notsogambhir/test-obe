// Role hierarchy for cascading permissions (higher number = higher privilege)
export const ROLE_HIERARCHY = {
  'ADMIN': 50,
  'UNIVERSITY': 40,
  'DEPARTMENT': 30,
  'PROGRAM_COORDINATOR': 20,
  'TEACHER': 10,
} as const;

// Type for administrative roles
export type AdministrativeRole = keyof typeof ROLE_HIERARCHY;

/**
 * Check if a user has the required role or higher in the administrative hierarchy
 * @param userRole - The current user's role
 * @param requiredRole - The minimum required role for access
 * @returns true if user has required role or higher, false otherwise
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
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
