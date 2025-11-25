'use client';

import { ErrorDashboard } from '@/components/error-dashboard';
import { ErrorBoundary } from '@/components/error-boundary';

export default function ErrorManagementPage() {
  return (
    <ErrorBoundary context="error_dashboard" showDetails={true}>
      <ErrorDashboard />
    </ErrorBoundary>
  );
}