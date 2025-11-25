'use client';

import { useAuth } from '@/hooks/use-auth';
import { CourseManagement } from '@/components/course-management';

export default function CoursesPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return <CourseManagement user={user} />;
}