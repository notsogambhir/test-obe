'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { DashboardOverview } from '@/components/dashboard-overview';
import { UserManagement } from '@/components/user-management';
import { AcademicStructure } from '@/components/academic-structure';
import { CourseManagement } from '@/components/course-management';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { SimpleDashboard } from '@/components/simple-dashboard';
import { Badge } from '@/components/ui/badge';

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

type ActiveView = 'dashboard' | 'users' | 'academic' | 'courses';

export function Dashboard() {
  const { user } = useAuth();
  const { getContextString } = useSidebarContext();
  const [activeView, setActiveView] = React.useState<ActiveView>('dashboard');
  const [useSimpleDashboard, setUseSimpleDashboard] = React.useState(false);

  const getNavigationItems = () => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
    ];

    if (user && (user.role === 'ADMIN' || user.role === 'UNIVERSITY')) {
      items.push(
        { id: 'users', label: 'User Management', icon: 'Users' },
        { id: 'academic', label: 'Academic Structure', icon: 'Building' }
      );
    }

    if (user && (user.role === 'TEACHER' || user.role === 'PROGRAM_COORDINATOR')) {
      items.push(
        { id: 'courses', label: 'Course Management', icon: 'BookOpen' }
      );
    }

    return items;
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement />;
      case 'academic':
        return <AcademicStructure user={user!} />;
      case 'courses':
        return <CourseManagement user={user!} />;
      default:
        return useSimpleDashboard ? <SimpleDashboard /> : <DashboardOverview />;
    }
  };

  // For now, we'll render the overview by default
  // In a real app, this would be handled by routing through the existing sidebar
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Badge variant={useSimpleDashboard ? "secondary" : "default"}>
            {useSimpleDashboard ? "Simple Mode" : "Full Mode"}
          </Badge>
          <button
            onClick={() => setUseSimpleDashboard(!useSimpleDashboard)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle Mode
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        {getNavigationItems().map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as ActiveView)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activeView === item.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {renderActiveView()}
      </div>
    </div>
  );
}