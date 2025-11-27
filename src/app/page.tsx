'use client';

import { AppWrapper } from '@/components/app-wrapper';
import { DatabaseInitializer } from '@/components/database-initializer';

export default function Home() {
  return (
    <AppWrapper>
      <DatabaseInitializer />
      <div className="p-6">
        <h1 className="text-2xl font-bold">OBE Management Portal</h1>
        <p>Faculty & Management System for Educational Outcomes</p>
      </div>
    </AppWrapper>
  );
}