'use client';

import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from '@/components/login-form';
import { ProgramSelection } from '@/components/program-selection';
import { BatchSelectionModal } from '@/components/batch-selection-modal';
import { GlobalLayout } from '@/components/global-layout';
import { memo } from 'react';

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper = memo(function AppWrapper({ children }: AppWrapperProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // For PC and Teacher roles, show program selection first
  if (user.role === 'PROGRAM_COORDINATOR' || user.role === 'TEACHER') {
    if (!user.programId) {
      return <ProgramSelection user={user} />;
    }
  }

  return (
    <GlobalLayout user={user}>
      {children}
      <BatchSelectionModal user={user} />
    </GlobalLayout>
  );
});

export { AppWrapper };