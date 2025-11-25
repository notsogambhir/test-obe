'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { memo } from 'react';

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

interface GlobalLayoutProps {
  user: User;
  children: React.ReactNode;
}

const GlobalLayout = memo(function GlobalLayout({ user, children }: GlobalLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, updateUserSelections } = useAuth();
  const { selectedProgram, selectedBatch, programs, batches } = useSidebarContext();
  const [activeView, setActiveView] = useState('dashboard');

  // Memoize path to view mapping to avoid recreating on every render
  const pathToViewMap = useMemo(() => ({
    '/': 'dashboard',
    '/admin': 'admin',
    '/users': 'users',
    '/academic': 'academic',
    '/courses': 'courses',
    '/students': 'students',
    '/teachers': 'teachers',
    '/faculty-management': 'faculty-management',
    '/student-management': 'student-management',
    '/program-outcomes': 'program-outcomes',
    '/reports': 'reports',
    '/obe-compliance': 'obe-compliance',
    '/system-settings': 'system-settings',
  }), []);

  // Memoize view to path mapping
  const viewToPathMap = useMemo(() => ({
    'dashboard': '/',
    'admin': '/admin',
    'users': '/users',
    'academic': '/academic',
    'courses': '/courses',
    'students': '/students',
    'teachers': '/teachers',
    'faculty-management': '/faculty-management',
    'student-management': '/student-management',
    'program-outcomes': '/program-outcomes',
    'reports': '/reports',
    'obe-compliance': '/obe-compliance',
    'system-settings': '/system-settings',
  }), []);

  // Update active view based on current path
  useEffect(() => {
    // Find matching view
    const matchedView = Object.entries(pathToViewMap).find(([path]) => 
      pathname === path || pathname.startsWith(path + '/')
    );

    if (matchedView) {
      setActiveView(matchedView[1]);
    }
  }, [pathname, pathToViewMap]);

  // Memoize display name functions
  const getProgramName = useCallback(() => {
    if (!selectedProgram) return '';
    const program = programs.find(p => p.id === selectedProgram);
    return program ? program.name : '';
  }, [selectedProgram, programs]);

  const getBatchName = useCallback(() => {
    if (!selectedBatch) return '';
    const batch = batches.find(b => b.id === selectedBatch);
    return batch ? batch.name : '';
  }, [selectedBatch, batches]);

  // Memoize display string
  const getDisplayString = useCallback(() => {
    const parts: string[] = [];
    const programName = getProgramName();
    const batchName = getBatchName();
    
    if (programName) parts.push(programName);
    if (batchName) parts.push(batchName);
    
    return parts.join(' - ');
  }, [getProgramName, getBatchName]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/');
  }, [logout, router]);

  const handleBackToSelection = useCallback(() => {
    // Clear program and batch selections
    if (user) {
      updateUserSelections({ programId: undefined, batchId: undefined });
    }
  }, [user, updateUserSelections]);

  const handleViewChange = useCallback((view: string) => {
    setActiveView(view);

    const targetPath = viewToPathMap[view];
    if (targetPath) {
      router.push(targetPath);
    }
  }, [viewToPathMap, router]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        user={user}
        activeView={activeView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        onBackToSelection={handleBackToSelection}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {getDisplayString() || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user.name}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {user.role.replace('_', ' ').toLowerCase()}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
});

export { GlobalLayout };