'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CollegeManagement } from '@/components/admin/college-management';
import { ProgramManagement } from '@/components/admin/program-management';
import { BatchManagement } from '@/components/admin/batch-management';
import { Building2, GraduationCap, Calendar, Settings } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('colleges');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold">Academic Management</h1>
          <p className="text-muted-foreground">
            Manage colleges, programs, and batches in the system
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colleges" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Colleges</span>
          </TabsTrigger>
          <TabsTrigger value="programs" className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4" />
            <span>Programs</span>
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Batches</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colleges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>College Management</span>
              </CardTitle>
              <CardDescription>
                Create and manage colleges. Colleges are the top-level organizational units in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CollegeManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Program Management</span>
              </CardTitle>
              <CardDescription>
                Create and manage academic programs. Programs belong to colleges and can be assigned to departments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgramManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Batch Management</span>
              </CardTitle>
              <CardDescription>
                Create and manage student batches. Batches belong to programs and represent cohorts of students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}