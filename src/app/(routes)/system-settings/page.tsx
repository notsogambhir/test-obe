'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">System Settings</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure system-wide settings, preferences, and administrative options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">System Settings Module</p>
            <p className="text-sm">This module is under development and will be available soon.</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>Features coming:</p>
              <ul className="mt-2 space-y-1">
                <li>• System configuration</li>
                <li>• User role management</li>
                <li>• Backup and restore</li>
                <li>• System maintenance tools</li>
                <li>• Security settings</li>
                <li>• Integration configurations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}