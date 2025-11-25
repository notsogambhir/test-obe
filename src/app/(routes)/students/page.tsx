'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionCreation } from '@/components/section-creation';
import { StudentManagementAdmin } from '@/components/student-management-admin';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useSidebarContext } from '@/contexts/sidebar-context';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId?: string;
  programId?: string;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const { selectedCollege, selectedProgram, selectedBatch } = useSidebarContext();

  // Check if user has view-only permissions (Program Coordinators and Teachers only)
  const isViewOnly = user ? ['PROGRAM_COORDINATOR', 'TEACHER'].includes(user.role) : false;
  
  // Check if user can access students page (All administrative roles)
  const canViewStudents = user ? ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PROGRAM_COORDINATOR', 'TEACHER'].includes(user.role) : false;
  
  // Check if user has management permissions (Admin, University, Department)
  const canManageStudents = user ? ['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(user.role) : false;

  // Check if user can perform CRUD operations (Admin, University, Department only)
  const canPerformCRUD = canManageStudents || !isViewOnly;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            {isViewOnly ? 'View student information' : 'Manage student enrollment and sections'}
          </p>
        </div>
        <Badge variant={canViewStudents ? "default" : "secondary"}>
          {user && user.role ? `${user.role.replace('_', ' ')}${isViewOnly ? ' (View Only)' : ''}` : 'Guest'}
        </Badge>
      </div>

      {canViewStudents ? (
        <>
          {/* Section Creation */}
          <SectionCreation user={user!} viewOnly={isViewOnly} />
          
          {/* Student Management */}
          <StudentManagementAdmin user={user!} viewOnly={isViewOnly} />
        </>
      ) : (
        <div className="text-center py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Access Restricted
                </h3>
                <p className="text-muted-foreground">
                  Only Administrators, University staff, Department Heads, Program Coordinators, and Teachers can access this feature.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}