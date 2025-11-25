'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Building,
  TrendingUp,
  Award,
  Settings
} from 'lucide-react';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { useState } from 'react';
import { CourseManagement } from '@/components/course-management';
import { useAuth } from '@/hooks/use-auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId?: string;
  departmentId?: string;
  programId?: string;
  batchId?: string;
}

export function DashboardOverview() {
  const { user } = useAuth();
  const { selectedCollege, selectedProgram, selectedBatch, colleges, programs, batches, getContextString } = useSidebarContext();
  const [showCourseManagement, setShowCourseManagement] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }
  const getRoleSpecificStats = () => {
    switch (user.role) {
      case 'ADMIN':
        return {
          title: 'System Overview',
          stats: [
            { label: 'Total Colleges', value: '[3]', icon: Building, color: 'text-red-600' },
            { label: 'Total Programs', value: '[6]', icon: GraduationCap, color: 'text-red-600' },
            { label: 'Total Users', value: '[150]', icon: Users, color: 'text-red-600' },
            { label: 'Active Batches', value: '[12]', icon: TrendingUp, color: 'text-red-600' },
          ],
        };
      case 'UNIVERSITY':
        return {
          title: 'University Dashboard',
          stats: [
            { label: 'Colleges', value: '[3]', icon: Building, color: 'text-red-600' },
            { label: 'Programs', value: '[6]', icon: GraduationCap, color: 'text-red-600' },
            { label: 'Departments', value: '[8]', icon: Users, color: 'text-red-600' },
            { label: 'Active Batches', value: '[12]', icon: TrendingUp, color: 'text-red-600' },
          ],
        };
      case 'DEPARTMENT':
        return {
          title: 'Department Dashboard',
          stats: [
            { label: 'Programs', value: '[2]', icon: GraduationCap, color: 'text-red-600' },
            { label: 'Faculty', value: '[25]', icon: Users, color: 'text-red-600' },
            { label: 'Active Batches', value: '[4]', icon: TrendingUp, color: 'text-red-600' },
            { label: 'Courses', value: '[48]', icon: BookOpen, color: 'text-red-600' },
          ],
        };
      case 'PROGRAM_COORDINATOR':
        return {
          title: 'Program Dashboard',
          stats: [
            { label: 'Students', value: '[120]', icon: Users, color: 'text-red-600' },
            { label: 'Courses', value: '[24]', icon: BookOpen, color: 'text-red-600' },
            { label: 'Faculty', value: '[8]', icon: Users, color: 'text-red-600' },
            { label: 'OBE Compliance', value: '[95%]', icon: Award, color: 'text-red-600' },
          ],
        };
      case 'TEACHER':
        return {
          title: 'Teacher Dashboard',
          stats: [
            { label: 'Courses Assigned', value: '[4]', icon: BookOpen, color: 'text-red-600' },
            { label: 'Students', value: '[160]', icon: Users, color: 'text-red-600' },
            { label: 'COs Defined', value: '[12]', icon: TrendingUp, color: 'text-red-600' },
            { label: 'PO Mappings', value: '[8]', icon: Award, color: 'text-red-600' },
          ],
        };
      default:
        return {
          title: 'Dashboard',
          stats: [],
        };
    }
  };

  const getContextDisplay = () => {
    const parts: string[] = [];
    if (selectedCollege) {
      const college = colleges.find(c => c.id === selectedCollege);
      if (college) parts.push(college.name);
    }
    if (selectedProgram) {
      const program = programs.find(p => p.id === selectedProgram);
      if (program) parts.push(program.name);
    }
    if (selectedBatch) {
      const batch = batches.find(b => b.id === selectedBatch);
      if (batch) parts.push(batch.name);
    }
    return parts.length > 0 ? parts.join(' > ') : 'All Data';
  };

  const { title, stats } = getRoleSpecificStats();
  const contextDisplay = getContextDisplay();

  // Show course management if toggled
  if (showCourseManagement) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowCourseManagement(false)}
              className="flex items-center gap-2"
            >
              ← Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
            </div>
          </div>
        </div>
        <CourseManagement user={user} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        
        {/* Context Display */}
        {(selectedCollege || selectedProgram || selectedBatch) && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <p className="text-sm text-red-800 font-medium">Current Scope:</p>
            <p className="text-sm text-red-600">{contextDisplay}</p>
          </div>
        )}

        {/* Course Management Access for Program Coordinators */}
        {user.role === 'PROGRAM_COORDINATOR' && user.programId && user.batchId && (
          <Button
            onClick={() => setShowCourseManagement(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <BookOpen className="h-4 w-4" />
            Manage Courses
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
                <CardTitle className="text-xs font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-3 w-3 ${stat.color}`} />
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-3">
          <CardHeader className="px-0 pt-0 pb-2">
            <CardTitle className="text-sm">[PLACEHOLDER] Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-xs">New CO-PO mapping template uploaded</p>
                <span className="text-xs text-gray-500 ml-auto">2h ago</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-xs">OBE report generated successfully</p>
                <span className="text-xs text-gray-500 ml-auto">5h ago</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-xs">NBA compliance review pending</p>
                <span className="text-xs text-gray-500 ml-auto">1d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="px-0 pt-0 pb-2">
            <CardTitle className="text-sm">[PLACEHOLDER] Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3 text-red-600" />
                  <span className="text-xs font-medium">Generate OBE Report</span>
                </div>
                <Badge variant="secondary" className="text-xs">New</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Award className="h-3 w-3 text-red-600" />
                  <span className="text-xs font-medium">View NBA Compliance</span>
                </div>
                <Badge variant="outline" className="text-xs">Updated</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-red-600" />
                  <span className="text-xs font-medium">Student Performance</span>
                </div>
                <Badge variant="outline" className="text-xs">Analytics</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}