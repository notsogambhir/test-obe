'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';

export default function TeachersPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <UserCheck className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Teachers Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Teachers Management</CardTitle>
          <CardDescription>
            Manage faculty members, assignments, and performance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Teachers Management Module</p>
            <p className="text-sm">This module is under development and will be available soon.</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>Features coming:</p>
              <ul className="mt-2 space-y-1">
                <li>• Faculty directory and profiles</li>
                <li>• Course assignments</li>
                <li>• Performance evaluation</li>
                <li>• Workload management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}