'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StudentManagementAdmin } from '@/components/student-management-admin';
import { StudentManagementProgramCoordinator } from '@/components/student-management-program-coordinator';
import { StudentManagementTeacher } from '@/components/student-management-teacher';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId?: string;
  programId?: string;
  batchId?: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    email: 'dept@example.com',
    name: 'Department User',
    role: 'DEPARTMENT',
    collegeId: 'cmhafms3q0001nfuy1lpdmsag',
  },
  {
    id: '2',
    email: 'coordinator@example.com',
    name: 'Program Coordinator',
    role: 'PROGRAM_COORDINATOR',
    collegeId: 'cmhafms3q0001nfuy1lpdmsag',
    programId: 'cmhafms3z000bnfuy97l5uj23',
  },
  {
    id: '3',
    email: 'teacher@example.com',
    name: 'Teacher',
    role: 'TEACHER',
    collegeId: 'cmhafms3q0001nfuy1lpdmsag',
  },
];

export default function TestStudentRolesPage() {
  const [selectedUser, setSelectedUser] = useState<User>(mockUsers[0]);

  const renderStudentManagement = () => {
    switch (selectedUser.role) {
      case 'DEPARTMENT':
        return <StudentManagementAdmin user={selectedUser} />;
      case 'PROGRAM_COORDINATOR':
        return <StudentManagementProgramCoordinator user={selectedUser} />;
      case 'TEACHER':
        return <StudentManagementTeacher user={selectedUser} />;
      default:
        return (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Role not supported</h3>
            <p className="text-gray-600">Selected role: {selectedUser.role}</p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Management Role Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select User Role to Test:
              </label>
              <Select value={selectedUser.id} onValueChange={(value) => {
                const user = mockUsers.find(u => u.id === value);
                if (user) setSelectedUser(user);
              }}>
                <SelectTrigger className="w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Current User Context:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(selectedUser, null, 2)}
              </pre>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-semibold mb-2">Expected Features:</p>
              <ul className="space-y-1">
                {selectedUser.role === 'DEPARTMENT' && (
                  <>
                    <li>• Full student management (Create, Read, Update, Delete)</li>
                    <li>• Bulk upload functionality</li>
                    <li>• Access to all students in college</li>
                  </>
                )}
                {selectedUser.role === 'PROGRAM_COORDINATOR' && (
                  <>
                    <li>• View students in program</li>
                    <li>• Active/Inactive status dropdown filter</li>
                    <li>• Student details popup</li>
                    <li>• No editing capabilities</li>
                  </>
                )}
                {selectedUser.role === 'TEACHER' && (
                  <>
                    <li>• View student directory</li>
                    <li>• Active/Inactive status filter</li>
                    <li>• Student details popup (read-only)</li>
                    <li>• Limited to view-only access</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border-t pt-6">
        {renderStudentManagement()}
      </div>
    </div>
  );
}