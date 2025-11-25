import { AppWrapper } from '@/components/app-wrapper';
import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<PageLoading message="Loading route..." />}>
      <AppWrapper>{children}</AppWrapper>
    </Suspense>
  );
}