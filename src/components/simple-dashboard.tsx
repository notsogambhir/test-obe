'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function SimpleDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Test</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a test dashboard component.</p>
            <Badge variant="secondary">Test</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}