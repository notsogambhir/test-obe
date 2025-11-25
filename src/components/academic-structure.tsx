'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building, GraduationCap, Calendar } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId?: string;
  departmentId?: string;
  programId?: string;
}

export function AcademicStructure({ user }: { user: User }) {
  const mockColleges = [
    { id: '1', name: 'CUIET', code: 'CUIET', programs: 2, departments: 3 },
    { id: '2', name: 'CBS', code: 'CBS', programs: 2, departments: 2 },
    { id: '3', name: 'CCP', code: 'CCP', programs: 2, departments: 2 },
  ];

  const mockPrograms = [
    { id: '1', name: 'BE ME', code: 'BEME', duration: 4, college: 'CUIET', batches: 4 },
    { id: '2', name: 'BE ECE', code: 'BEECE', duration: 4, college: 'CUIET', batches: 4 },
    { id: '3', name: 'BBA', code: 'BBA', duration: 3, college: 'CBS', batches: 3 },
    { id: '4', name: 'MBA Global', code: 'MBA', duration: 2, college: 'CBS', batches: 2 },
    { id: '5', name: 'B. Pharma', code: 'BPHARMA', duration: 3, college: 'CCP', batches: 3 },
    { id: '6', name: 'M. Pharma', code: 'MPHARMA', duration: 2, college: 'CCP', batches: 2 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Structure</h1>
        </div>
        <div className="flex gap-2">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add College
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Program
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-3">
          <CardHeader className="px-0 pt-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4" />
              Colleges
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-2">
              {mockColleges.map((college) => (
                <div key={college.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                      <Building className="h-3 w-3 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{college.name}</p>
                      <p className="text-xs text-gray-600">{college.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">{college.programs} Programs</Badge>
                    <Badge variant="secondary" className="text-xs">{college.departments} Departments</Badge>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="px-0 pt-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4" />
              Programs
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-2">
              {mockPrograms.map((program) => (
                <div key={program.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                      <GraduationCap className="h-3 w-3 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{program.name}</p>
                      <p className="text-xs text-gray-600">{program.code} • {program.college}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">{program.duration} years</Badge>
                    <Badge variant="secondary" className="text-xs">{program.batches} batches</Badge>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-3">
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            Recent Batches
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="text-center py-4 text-gray-500">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-gray-300" />
            <p className="text-xs">Batch management will be available here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}