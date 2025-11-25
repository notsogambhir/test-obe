'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestPatchPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const testPatchRequest = async () => {
    if (!courseId) {
      setResult('❌ Please enter a course ID');
      return;
    }

    setLoading(true);
    setResult('Testing PATCH request...');
    
    try {
      console.log('=== TEST PATCH REQUEST ===');
      console.log('Course ID:', courseId);
      console.log('Status:', status);
      
      const url = `/api/courses/${courseId}/status`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Get response as text first
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        responseData = { rawResponse: responseText };
      }

      if (response.ok) {
        setResult(`✅ PATCH Request Successful!\n\nStatus: ${response.status}\n\nResponse:\n${JSON.stringify(responseData, null, 2)}`);
      } else {
        setResult(`❌ PATCH Request Failed\n\nStatus: ${response.status}\nStatus Text: ${response.statusText}\n\nResponse:\n${JSON.stringify(responseData, null, 2)}`);
      }
    } catch (error) {
      console.error('PATCH request error:', error);
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setResult('Testing authentication...');
    
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Authentication Successful!\n\nUser: ${data.user.name}\nEmail: ${data.user.email}\nRole: ${data.user.role}\nCollege ID: ${data.user.collegeId}\nProgram ID: ${data.user.programId}\nBatch ID: ${data.user.batchId}`);
      } else {
        setResult(`❌ Authentication Failed: ${response.status}`);
      }
    } catch (error) {
      setResult(`❌ Auth Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testCourses = async () => {
    setLoading(true);
    setResult('Testing courses API...');
    
    try {
      const response = await fetch('/api/courses', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const courseList = data.slice(0, 5).map((course: any) => 
          `${course.code} - ${course.name} (${course.status}) - ID: ${course.id}`
        ).join('\n');
        
        setResult(`✅ Courses API Successful!\n\nTotal Courses: ${data.length}\n\nFirst 5 courses:\n${courseList}`);
      } else {
        setResult(`❌ Courses API Failed: ${response.status}`);
      }
    } catch (error) {
      setResult(`❌ Courses Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">PATCH Request Test Page</h1>
          <p className="mt-2 text-gray-600">Debug course status update functionality</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testAuth}
                disabled={loading}
                className="w-full"
              >
                Test Auth
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Courses API</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testCourses}
                disabled={loading}
                className="w-full"
              >
                Test Courses
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test PATCH Request</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testPatchRequest}
                disabled={loading}
                className="w-full"
              >
                Test PATCH
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>PATCH Request Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseId">Course ID</Label>
              <Input
                id="courseId"
                placeholder="Enter course ID (e.g., cmhafmsh0000nfuyu3s66vyv)"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FUTURE">Future</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Test Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                {result}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>First, click "Test Auth" to verify you're logged in</li>
              <li>Click "Test Courses" to get a list of available courses</li>
              <li>Copy a course ID from the courses list and paste it above</li>
              <li>Select a new status for the course</li>
              <li>Click "Test PATCH" to attempt the status update</li>
              <li>Check the browser console (F12) for detailed debugging information</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}