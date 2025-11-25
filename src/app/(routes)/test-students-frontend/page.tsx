'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

export default function TestStudentsFrontendPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testStudentsAPI = async () => {
    if (!user) {
      toast.error('No user found');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (user.collegeId) params.append('collegeId', user.collegeId);
      if (user.programId) params.append('programId', user.programId);
      if (user.batchId) params.append('batchId', user.batchId);

      console.log('🔍 Frontend test - Making request with params:', params.toString());
      console.log('🔍 Frontend test - User:', user);

      const response = await fetch(`/api/students?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('🔍 Frontend test - Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Frontend test - Students data:', data);
        setStudents(data);
        toast.success(`Found ${data.length} students`);
      } else {
        const errorData = await response.json();
        console.error('🔍 Frontend test - Error response:', errorData);
        toast.error(`Error: ${errorData.error || 'Failed to fetch students'}`);
      }
    } catch (error) {
      console.error('🔍 Frontend test - Network error:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Frontend Students API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Current User:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          <Button 
            onClick={testStudentsAPI} 
            disabled={loading || !user}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Students API (Frontend)'}
          </Button>

          {students.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold mb-2">Students Found ({students.length}):</h3>
              <pre className="text-sm overflow-auto max-h-96">
                {JSON.stringify(students, null, 2)}
              </pre>
            </div>
          )}

          {students.length === 0 && !loading && user && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold mb-2">No Students Found</h3>
              <p className="text-sm text-gray-600">
                This is expected if there are no students in the database.
                The API call was successful if you see a success toast above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}