'use client';

import { useAuth } from '@/hooks/use-auth';
import { AcademicStructure } from '@/components/academic-structure';

export default function AcademicPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <AcademicStructure user={user} />
    </div>
  );
}