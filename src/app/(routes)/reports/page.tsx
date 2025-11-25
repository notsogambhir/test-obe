'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">[PLACEHOLDER] Reports & Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This is a placeholder for the Reports & Analytics page. 
            This page will provide comprehensive reports and analytics for OBE compliance and institutional performance.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">Features to be implemented:</p>
            <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
              <li>Course attainment reports</li>
              <li>Program outcome analysis</li>
              <li>NBA compliance reports</li>
              <li>Student performance analytics</li>
              <li>Institutional benchmarking</li>
              <li>Export capabilities for reports</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}