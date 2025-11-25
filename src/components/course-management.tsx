'use client';

import { useAuth } from '@/hooks/use-auth';
import { CourseManagementCoordinator } from '@/components/course-management-coordinator';
import { CourseManagementTeacher } from '@/components/course-management-teacher';
import { CourseManagementAdmin } from '@/components/course-management-simple';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId?: string;
  departmentId?: string;
  programId?: string;
  batchId?: string;
}

export function CourseManagement({ user }: { user: User }) {
  // Use different components based on user role
  if (user.role === 'PROGRAM_COORDINATOR') {
    return <CourseManagementCoordinator user={user} />;
  } else if (user.role === 'TEACHER') {
    return <CourseManagementTeacher user={user} />;
  } else if (user.role === 'ADMIN' || user.role === 'UNIVERSITY' || user.role === 'DEPARTMENT') {
    // Admin, University, and Department users get comprehensive course management view
    return <CourseManagementAdmin user={user} />;
  }

  // Fallback for other roles
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
        </div>
      </div>
      
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">Course management is available for authorized personnel only.</p>
      </div>
    </div>
  );
}