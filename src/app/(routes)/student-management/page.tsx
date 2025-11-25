'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function StudentManagementPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Student Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>
            Department-level student administration and records management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Student Management Module</p>
            <p className="text-sm">This module is under development and will be available soon.</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>Features coming:</p>
              <ul className="mt-2 space-y-1">
                <li>• Student admissions and enrollment</li>
                <li>• Academic records management</li>
                <li>• Student performance tracking</li>
                <li>• Discipline and attendance management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}