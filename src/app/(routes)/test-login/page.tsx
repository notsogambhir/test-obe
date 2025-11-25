'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestLoginPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async (email: string, password: string, collegeCode?: string) => {
    setLoading(true);
    setResult('Testing login...');
    
    try {
      // First get the college
      let collegeId = '';
      if (collegeCode) {
        const collegesResponse = await fetch('/api/colleges');
        const colleges = await collegesResponse.json();
        const college = colleges.find((c: any) => c.code === collegeCode);
        collegeId = college?.id || '';
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, collegeId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Login Successful!\n\nUser: ${data.user.name}\nEmail: ${data.user.email}\nRole: ${data.user.role}\nCollege ID: ${data.user.collegeId}\n\nToken: ${data.token.substring(0, 50)}...`);
      } else {
        setResult(`❌ Login Failed: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Login Test Page</h1>
          <p className="mt-2 text-gray-600">Test the login functionality directly</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Logins</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => testLogin('admin@obeportal.com', 'password123')}
                disabled={loading}
                variant="outline"
              >
                Test Admin Login
              </Button>
              <Button
                onClick={() => testLogin('emily.martinez@pc.com', 'password123', 'IOT')}
                disabled={loading}
                variant="outline"
              >
                Test PC (IOT) Login
              </Button>
              <Button
                onClick={() => testLogin('sarah.brown0@teacher.com', 'password123', 'IOT')}
                disabled={loading}
                variant="outline"
              >
                Test Teacher (IOT) Login
              </Button>
              <Button
                onClick={() => testLogin('michael.martinez@dept.com', 'password123', 'IOT')}
                disabled={loading}
                variant="outline"
              >
                Test Dept (IOT) Login
              </Button>
            </div>

            {result && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{result}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Click any test button above to attempt a login</li>
              <li>The result will show detailed information about the login attempt</li>
              <li>If successful, you'll see user details and token information</li>
              <li>If failed, you'll see the specific error message</li>
              <li>Check the browser console (F12) for additional debugging information</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>URL Fix Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✅ <strong>Fixed:</strong> Updated all API calls to use relative URLs instead of hardcoded localhost URLs.
                This resolves the "ERR_CONNECTION_REFUSED" error when accessing the app from different domains.
              </p>
              <p className="text-sm text-green-800 mt-2">
                ✅ <strong>Fixed:</strong> Updated course management components to use relative URLs.
                Courses should now load properly after login.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}