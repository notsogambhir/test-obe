'use client';

import { useState, useEffect } from 'react';

import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen,
  Building,
  Settings,
  ChevronDown,
  Wrench,
  UserCheck,
  Target,
  FileText,
  Shield,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { NavLink } from '@/components/ui/nav-link';
import { useAuth } from '@/hooks/use-auth';

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

interface SidebarProps {
  user: User;
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => Promise<void>;
  onBackToSelection?: () => void;
}

export function Sidebar({ user, activeView, onViewChange, onLogout, onBackToSelection }: SidebarProps) {
  const { hasPermission } = useAuth();
  const {
    selectedCollege,
    selectedProgram,
    selectedBatch,
    colleges,
    programs,
    batches,
    loadingPrograms,
    loadingBatches,
    setSelectedCollege,
    setSelectedProgram,
    setSelectedBatch,
  } = useSidebarContext();

  // Debug logging for department heads
  useEffect(() => {
    if (user.role === 'DEPARTMENT') {
      console.log('Sidebar Debug - Department Head Info:', {
        userName: user.name,
        userRole: user.role,
        userCollegeId: user.collegeId,
        selectedCollege: selectedCollege,
        collegesCount: colleges.length,
        collegeNames: colleges.map(c => ({ id: c.id, name: c.name }))
      });
    }
  }, [user, selectedCollege, colleges]);

  // Check if user is high-level (can see contextual filters)
  const isHighLevelUser = hasPermission('DEPARTMENT');
  
  // Check if user should see batch dropdown
  const shouldSeeBatchDropdown = hasPermission('TEACHER');

  // Initialize context for department users
  useEffect(() => {
    if (user.role === 'DEPARTMENT' && user.collegeId && !selectedCollege) {
      console.log('Sidebar: Initializing department head college:', user.collegeId);
      setSelectedCollege(user.collegeId);
    }
  }, [user.role, user.collegeId, selectedCollege, setSelectedCollege]);

  // Initialize context for program coordinators and teachers
  useEffect(() => {
    if ((user.role === 'PROGRAM_COORDINATOR' || user.role === 'TEACHER') && user.programId && !selectedProgram) {
      setSelectedProgram(user.programId);
    }
  }, [user.role, user.programId, selectedProgram, setSelectedProgram]);

  // Initialize batch for users with batchId
  useEffect(() => {
    if (user.batchId && !selectedBatch) {
      setSelectedBatch(user.batchId);
    }
  }, [user.batchId, selectedBatch, setSelectedBatch]);

  const menuItems = [
    // Dashboard - available to all roles
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      requiredRole: 'TEACHER', // Minimum role required
    },
    // Academic Management - Admin only
    {
      id: 'admin',
      label: 'Academic Management',
      href: '/admin',
      icon: Wrench,
      requiredRole: 'ADMIN',
    },
    // Courses - available to all roles
    {
      id: 'courses',
      label: 'Courses',
      href: '/courses',
      icon: BookOpen,
      requiredRole: 'TEACHER',
    },
    // Students - available to all roles
    {
      id: 'students',
      label: 'Students',
      href: '/students',
      icon: Users,
      requiredRole: 'TEACHER',
    },
    // Faculty Management - Department and above
    {
      id: 'faculty-management',
      label: 'Faculty Management',
      href: '/faculty-management',
      icon: UserCheck,
      requiredRole: 'DEPARTMENT',
    },
    // Program Outcomes - Program Coordinator and above
    {
      id: 'program-outcomes',
      label: 'Program Outcomes',
      href: '/program-outcomes',
      icon: Target,
      requiredRole: 'PROGRAM_COORDINATOR',
    },
    // User Management - Admin only
    {
      id: 'users',
      label: 'User Management',
      href: '/users',
      icon: Users,
      requiredRole: 'ADMIN',
    },
    // System Settings - Admin only
    {
      id: 'system-settings',
      label: 'System Settings',
      href: '/system-settings',
      icon: Settings,
      requiredRole: 'ADMIN',
    },
    {
      id: 'academic',
      label: 'Academic Structure',
      href: '/academic',
      icon: GraduationCap,
      requiredRole: 'DEPARTMENT',
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    hasPermission(item.requiredRole)
  );

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <h2 className="font-semibold text-gray-900">OBE Portal</h2>
        </div>
      </div>

      {/* Contextual Dropdown Filters */}
      {(isHighLevelUser || shouldSeeBatchDropdown) && (
        <div className="p-4 border-b border-gray-100">
          <div className="space-y-3">
            {/* College Dropdown - Only for high-level users */}
            {isHighLevelUser && (
              <div>
                <Label htmlFor="college-select" className="text-xs font-medium text-gray-600">College</Label>
                <Select
                  value={selectedCollege || ''}
                  onValueChange={(value) => setSelectedCollege(value)}
                  disabled={user.role === 'DEPARTMENT'}
                >
                  <SelectTrigger id="college-select" className="mt-1">
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((college) => (
                      <SelectItem key={college.id} value={college.id}>
                        {college.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Debug info */}
                {user.role === 'DEPARTMENT' && (
                  <div className="text-xs text-gray-500 mt-1">
                    Debug: User collegeId: {user.collegeId}, Selected: {selectedCollege}
                  </div>
                )}
              </div>
            )}

            {/* Program Dropdown - For high-level users and program coordinators/teachers */}
            {isHighLevelUser || hasPermission('PROGRAM_COORDINATOR') ? (
              <div>
                <Label htmlFor="program-select" className="text-xs font-medium text-gray-600">Program</Label>
                <Select
                  value={selectedProgram || ''}
                  onValueChange={(value) => setSelectedProgram(value)}
                  disabled={(!selectedCollege && isHighLevelUser) || (user.role === 'TEACHER' && loadingPrograms) || loadingPrograms}
                >
                  <SelectTrigger id="program-select" className="mt-1">
                    <SelectValue placeholder={
                      user.role === 'TEACHER'
                        ? loadingPrograms 
                          ? "Loading programs..." 
                          : "Select program"
                        : selectedCollege 
                          ? "Select program" 
                          : isHighLevelUser
                            ? "Select college first"
                            : "Select program"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {/* Batch Dropdown - For all users who should see it */}
            <div>
              <Label htmlFor="batch-select" className="text-xs font-medium text-gray-600">Batch</Label>
              <Select
                value={selectedBatch || ''}
                onValueChange={(value) => setSelectedBatch(value)}
                disabled={(!selectedProgram && isHighLevelUser) || (!selectedProgram && user.role === 'TEACHER') || loadingBatches}
              >
                <SelectTrigger id="batch-select" className="mt-1">
                  <SelectValue placeholder={
                    selectedProgram 
                      ? "Select batch" 
                      : user.role === 'TEACHER'
                        ? "Select program first"
                        : isHighLevelUser
                          ? "Select program first"
                          : "Select program"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="flex-1 p-2 overflow-y-auto">
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.id} 
                href={item.href}
                prefetch={true}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}