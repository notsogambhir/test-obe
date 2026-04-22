'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Dynamically import Select components to avoid SSR issues
const Select = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.Select })), { ssr: false });
const SelectContent = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectContent })), { ssr: false });
const SelectItem = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectItem })), { ssr: false });
const SelectTrigger = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectTrigger })), { ssr: false });
const SelectValue = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectValue })), { ssr: false });

interface College {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Batch {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
}

export function LoginForm() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    collegeId: '',
    batchId: '',
  });
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showBatchSelection, setShowBatchSelection] = useState(false);
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [fetchingDemoUsers, setFetchingDemoUsers] = useState(false);

  useEffect(() => {
    fetchColleges();
    fetchBatches();
    fetchDemoUsers();
  }, []);

  const fetchDemoUsers = async () => {
    setFetchingDemoUsers(true);
    try {
      const response = await fetch('/api/auth/demo-users');
      if (response.ok) {
        const data = await response.json();
        setDemoUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch demo users:', error);
    } finally {
      setFetchingDemoUsers(false);
    }
  };

  const fetchColleges = async () => {
    try {
      console.log('Fetching colleges...');
      const response = await fetch('/api/colleges');
      console.log('Colleges response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Colleges data:', data);
        setColleges(data);
      } else {
        console.error('Failed to fetch colleges:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    }
  };

  const fetchBatches = async () => {
    // Don't fetch batches initially - they require a programId
    // Batches will be fetched when needed (after program selection)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields
    const validationErrors: string[] = [];
    if (!formData.email) validationErrors.push("Email is required");
    if (!formData.password) validationErrors.push("Password is required");
    if (!formData.collegeId) validationErrors.push("College selection is required");

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password, formData.collegeId);

      // If batch was selected, store it for after login
      if (formData.batchId) {
        localStorage.setItem('obe-selected-batch', formData.batchId);
      }

      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting to your dashboard...",
      });

      // Don't reload - let the auth state change naturally redirect the user
      // The AppWrapper will automatically show the dashboard when user state changes

    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = "An unexpected error occurred";
      let errorTitle = "Login Failed";

      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('invalid credentials') || message.includes('college access denied')) {
          errorTitle = "Authentication Failed";
          errorMessage = "Invalid email, password, or college access. Please check your credentials and try again.";
        } else if (message.includes('email and password are required')) {
          errorTitle = "Missing Information";
          errorMessage = "Please enter both email and password.";
        } else if (message.includes('internal server error')) {
          errorTitle = "Server Error";
          errorMessage = "Our servers are experiencing issues. Please try again in a few moments.";
        } else if (message.includes('network') || message.includes('fetch')) {
          errorTitle = "Network Error";
          errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, password: string, collegeCode?: string) => {
    setLoading(true);

    try {
      // Find college ID if college code is provided
      let collegeId = formData.collegeId;

      if (collegeCode) {
        // Wait for colleges to load if needed
        if (colleges.length === 0) {
          console.log('Colleges not loaded yet, fetching...');
          await fetchColleges();
          // Wait a bit more for state to update and check again
          let attempts = 0;
          while (colleges.length === 0 && attempts < 5) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
          }
        }

        const college = colleges.find(c => c.code === collegeCode);
        if (college) {
          collegeId = college.id;
          setFormData(prev => ({ ...prev, collegeId: college.id }));
          console.log(`Found college ${collegeCode} with ID: ${college.id}`);
        } else {
          console.error(`College with code ${collegeCode} not found. Available colleges:`, colleges.map(c => ({ code: c.code, name: c.name })));
          throw new Error(`College with code ${collegeCode} not found`);
        }
      } else {
        // For admin and university users, try to find first available college
        if (!collegeId && colleges.length > 0) {
          collegeId = colleges[0].id;
          setFormData(prev => ({ ...prev, collegeId }));
          console.log(`Using first available college with ID: ${collegeId}`);
        }
      }

      console.log('Attempting quick login:', { email, collegeId, collegeCode });
      await login(email, password, collegeId);

      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting to your dashboard...`,
      });

    } catch (error) {
      console.error('Quick login error:', error);

      let errorMessage = "An unexpected error occurred during quick login";
      let errorTitle = "Quick Login Failed";

      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('college with code') || message.includes('not found')) {
          errorTitle = "College Not Found";
          errorMessage = "The specified college could not be found. Please try selecting a college manually.";
        } else if (message.includes('invalid credentials') || message.includes('college access denied')) {
          errorTitle = "Authentication Failed";
          errorMessage = "Invalid credentials for this account. Please check the quick login credentials.";
        } else if (message.includes('internal server error')) {
          errorTitle = "Server Error";
          errorMessage = "Our servers are experiencing issues. Please try again in a few moments.";
        } else if (message.includes('network') || message.includes('fetch')) {
          errorTitle = "Network Error";
          errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            OBE Portal
          </h2>
        </div>

        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">Demo Application</AlertTitle>
          <AlertDescription className="text-amber-700">
            This app is comprised only of mock data and is a demo for testing purposes.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Faculty & Management Portal</CardTitle>
            <CardDescription>
              Access the OBE management system. This portal is for faculty, administrators, and management staff only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Quick Login Buttons */}
            {/* Quick Login Buttons */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg max-h-[400px] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-blue-700">Quick Login (Active Demo Accounts)</h4>
                {fetchingDemoUsers && <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>}
              </div>

              {demoUsers.length === 0 && !fetchingDemoUsers ? (
                <p className="text-xs text-blue-600 italic">No test accounts available.</p>
              ) : (
                <div className="space-y-4">
                  {/* Group users by role */}
                  {Array.from(new Set(demoUsers.map(u => u.role))).map(role => (
                    <div key={role} className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 border-b border-blue-100 pb-1">
                        {role.replace('_', ' ')}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {demoUsers.filter(u => u.role === role).map(user => (
                          <Button
                            key={user.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickLogin(user.email, 'password123', user.collegeCode)}
                            className="text-[10px] h-auto py-1.5 px-2 justify-start items-center text-left whitespace-normal"
                            disabled={loading}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[120px]">{user.name}</span>
                              <span className="text-[9px] opacity-70">{user.collegeCode || 'No College'}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 space-y-1 text-xs text-blue-600 pt-3 border-t border-blue-100">
                <p><strong>Note:</strong> All demo accounts use <code>password123</code></p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                <Select
                  value={formData.collegeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, collegeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((college) => (
                      <SelectItem key={college.id} value={college.id}>
                        {college.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              {/* Batch Selection - Optional for Teachers and Program Coordinators */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch">Batch (Optional)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBatchSelection(!showBatchSelection)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showBatchSelection ? 'Hide' : 'Show'} batch selection
                  </Button>
                </div>
                {showBatchSelection && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-xs text-gray-600 mb-2">
                      Select a batch to set it as your default after login (for Teachers and Program Coordinators)
                    </p>
                    <Select
                      value={formData.batchId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, batchId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} ({batch.startYear}-{batch.endYear})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
