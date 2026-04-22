'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AcademicPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg text-muted-foreground animate-pulse">Redirecting to Academic Management...</p>
      </div>
    </div>
  );
}