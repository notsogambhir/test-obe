'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TestStudentsPage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current user
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          console.log('🔍 Test page - User data:', data.user);
        }
      })
      .catch(err => console.error('Error fetching user:', err));
  }, []);

  const testStudentsAPI = async () => {
    if (!user) {
      toast.error('No user found');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (user.collegeId) params.append('collegeId', user.collegeId);
      if (user.departmentId) params.append('departmentId', user.departmentId);
      if (user.programId) params.append('programId', user.programId);
      if (user.batchId) params.append('batchId', user.batchId);

      console.log('🔍 Test page - Making request with params:', params.toString());

      const response = await fetch(`/api/students?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 Test page - Response status:', response.status);
      console.log('🔍 Test page - Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Test page - Students data:', data);
        setStudents(data);
        toast.success(`Found ${data.length} students`);
      } else {
        const errorData = await response.json();
        console.error('🔍 Test page - Error response:', errorData);
        toast.error(`Error: ${errorData.error || 'Failed to fetch students'}`);
      }
    } catch (error) {
      console.error('🔍 Test page - Network error:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Students API Test</CardTitle>
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
            {loading ? 'Testing...' : 'Test Students API'}
          </Button>

          {students.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold mb-2">Students Found ({students.length}):</h3>
              <pre className="text-sm overflow-auto max-h-96">
                {JSON.stringify(students, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}