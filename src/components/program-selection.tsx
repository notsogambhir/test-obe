'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toaster-simple';

interface Program {
  id: string;
  name: string;
  code: string;
  duration: number;
  description?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId?: string;
  departmentId?: string;
  programId?: string;
}

export function ProgramSelection({ user }: { user: User }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUserSelections } = useAuth();

  useEffect(() => {
    if (user.collegeId) {
      fetchPrograms(user.collegeId);
    }
  }, [user.collegeId]);

  const fetchPrograms = async (collegeId: string) => {
    try {
      const response = await fetch(`/api/programs?collegeId=${collegeId}`);
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
      toast.error(
        "Error",
        "Failed to load programs"
      );
    }
  };

  const handleProgramSelect = async () => {
    if (!selectedProgram) {
      toast.error(
        "Error",
        "Please select a program"
      );
      return;
    }

    setLoading(true);
    try {
      // Update user's program selection
      const response = await fetch('/api/auth/update-program', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ programId: selectedProgram }),
      });

      if (response.ok) {
        // Update local state immediately
        updateUserSelections({ programId: selectedProgram });
        toast.success(
          "Success",
          "Program selected successfully"
        );
        // The page will automatically redirect due to auth state change
      } else {
        throw new Error('Failed to update program');
      }
    } catch (error) {
      toast.error(
        "Error",
        "Failed to select program"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Select Program
          </h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Program Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Available Programs</label>
                <Select
                  value={selectedProgram}
                  onValueChange={setSelectedProgram}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name} ({program.duration} years)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleProgramSelect}
                className="w-full" 
                disabled={loading || !selectedProgram}
              >
                {loading ? 'Selecting...' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}