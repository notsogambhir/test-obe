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
  Settings,
  Calendar,
  FileText,
  Grid,
  Target,
  Clipboard
} from 'lucide-react';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { useState } from 'react';
import { CourseManagement } from '@/components/course-management';
import { useAuth } from '@/hooks/use-auth';

import { User } from '@/types/user';

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
          title: 'System Administrator',
          description: 'Complete system control and oversight',
          stats: [
            { label: 'Total Users', value: 'All Users', icon: 'Users', color: 'text-blue-600' },
            { label: 'Colleges', value: 'All Colleges', icon: 'Building', color: 'text-green-600' },
            { label: 'Programs', value: 'All Programs', icon: 'BookOpen', color: 'text-purple-600' },
            { label: 'Batches', value: 'All Batches', icon: Calendar, color: 'text-orange-600' },
          ],
          responsibilities: [
            'User Management - Create, manage, and deactivate user accounts across all roles',
            'College Management - Create new colleges, update college information, set college hierarchies',
            'Program Creation - Create academic programs, define program structures and requirements',
            'Batch Management - Create academic batches, set batch timelines, manage batch enrollments',
            'Course Defaults - Set default course parameters, assessment weights, and grading schemes',
            'System Configuration - Configure system-wide settings, permissions, and academic policies',
            'Data Oversight - Complete access to all data, reports, and system analytics',
            'Inherits all features and responsibilities from other roles'
          ],
          features: [
            'Create and manage user accounts',
            'Add and configure colleges',
            'Create academic programs',
            'Manage academic batches',
            'Set course defaults and parameters',
            'Configure system settings',
            'Access all reports and analytics',
            'Override permissions for any role',
            'Manage department structures',
            'Supervise program coordinators',
            'Monitor teacher activities',
            'Access student management',
            'Configure assessment systems'
          ]
        };

      case 'UNIVERSITY':
        return {
          title: 'University Administrator',
          description: 'University-wide oversight and monitoring',
          stats: [
            { label: 'Colleges', value: 'View All', icon: Building, color: 'text-blue-600' },
            { label: 'Programs', value: 'View All', icon: BookOpen, color: 'text-green-600' },
            { label: 'Departments', value: 'View All', icon: Users, color: 'text-purple-600' },
            { label: 'Reports', value: 'Full Access', icon: FileText, color: 'text-orange-600' },
          ],
          responsibilities: [
            'University Monitoring - Monitor all college activities and performance metrics',
            'View-Only Access - Read-only access to all university functions and data',
            'Report Generation - Generate comprehensive reports for all university operations',
            'Compliance Oversight - Ensure NBA compliance across all colleges and programs',
            'Performance Tracking - Monitor KPIs for colleges, departments, and programs',
            'Data Analytics - Access analytics dashboards for university-wide insights',
            'Audit Trail - Review system logs and user activities across university',
            'Resource Planning - Analyze resource utilization and allocation patterns',
            'Quality Assurance - Monitor academic quality standards and implementation'
          ],
          features: [
            'View all college information',
            'Access university-wide reports',
            'Monitor performance metrics',
            'Review compliance status',
            'Analyze enrollment trends',
            'Track assessment outcomes',
            'Monitor faculty workload',
            'Review resource utilization',
            'Access audit logs',
            'Generate custom reports',
            'View departmental performance',
            'Monitor student progression',
            'Track program completion rates'
          ]
        };

      case 'DEPARTMENT':
        return {
          title: 'Department Head',
          description: 'Department-level academic administration',
          stats: [
            { label: 'Students', value: 'Manage All', icon: Users, color: 'text-blue-600' },
            { label: 'Batches', value: 'Department', icon: Calendar, color: 'text-green-600' },
            { label: 'Sections', value: 'Manage All', icon: Grid, color: 'text-purple-600' },
            { label: 'Courses', value: 'Department', icon: BookOpen, color: 'text-orange-600' },
          ],
          responsibilities: [
            'Student Management - Add students to batches, manage student records and enrollments',
            'Batch Administration - Create and manage departmental batches and timelines',
            'Section Assignment - Assign students to specific sections within batches',
            'Student Status Control - Set student active/inactive status as needed',
            'Record Maintenance - Maintain accurate student academic records',
            'Enrollment Oversight - Monitor and manage student enrollment patterns',
            'Attendance Tracking - Oversee student attendance and participation',
            'Performance Monitoring - Track student academic performance and progress',
            'Communication Hub - Serve as primary contact for student-related matters',
            'Documentation - Maintain student documentation and compliance records'
          ],
          features: [
            'Add new students to batches',
            'Update student information',
            'Manage batch assignments',
            'Create and assign sections',
            'Set student active/inactive status',
            'View student academic records',
            'Monitor enrollment statistics',
            'Track attendance data',
            'Generate student reports',
            'Manage section rosters',
            'Update student contact information',
            'Track academic progress',
            'Handle transfer requests',
            'Maintain student documents'
          ]
        };

      case 'PROGRAM_COORDINATOR':
        return {
          title: 'Program Coordinator',
          description: 'Program management and coordination',
          stats: [
            { label: 'Courses', value: 'Manage All', icon: BookOpen, color: 'text-blue-600' },
            { label: 'Teachers', value: 'Assign To', icon: Users, color: 'text-green-600' },
            { label: 'Sections', value: 'Allocate', icon: Grid, color: 'text-purple-600' },
            { label: 'Targets', value: 'Set Course', icon: Target, color: 'text-orange-600' },
          ],
          responsibilities: [
            'Course Management - Create, update, and manage all courses within the program',
            'Target Setting - Set course-level targets and learning objectives',
            'Program Outcomes - Create and manage Program Outcomes (POs) for the program',
            'Faculty Assignment - Assign courses and sections to qualified teachers',
            'Curriculum Oversight - Ensure curriculum alignment and academic standards',
            'Assessment Planning - Plan assessment strategies and evaluation methods',
            'Quality Assurance - Monitor course delivery and educational quality',
            'Resource Coordination - Coordinate resources needed for course delivery',
            'Progress Monitoring - Track student progress and course effectiveness',
            'Reporting - Generate program-specific reports and analytics'
          ],
          features: [
            'Create new courses',
            'Edit existing courses',
            'Set course-level targets',
            'Create Program Outcomes (POs)',
            'Assign teachers to courses',
            'Allocate sections to teachers',
            'Manage course prerequisites',
            'Set assessment criteria',
            'Monitor course enrollment',
            'Track student performance',
            'Generate course reports',
            'Manage curriculum alignment',
            'Coordinate teaching schedules',
            'Review assessment results',
            'Update program documentation'
          ]
        };

      case 'TEACHER':
        return {
          title: 'Teacher',
          description: 'Course instruction and assessment management',
          stats: [
            { label: 'Courses', value: 'Assigned', icon: BookOpen, color: 'text-blue-600' },
            { label: 'Assessments', value: 'Create & Manage', icon: Clipboard, color: 'text-green-600' },
            { label: 'COs', value: 'Define & Map', icon: Target, color: 'text-purple-600' },
            { label: 'Students', value: 'Teach & Grade', icon: Users, color: 'text-orange-600' },
          ],
          responsibilities: [
            'Assessment Creation - Create various types of assessments (quizzes, exams, assignments)',
            'Course Outcomes - Define Course Outcomes (COs) for each course',
            'CO-PO Mapping - Map Course Outcomes to Program Outcomes for accreditation',
            'Question Management - Create questions with associated COs for assessments',
            'Marks Upload - Upload and manage student assessment marks and grades',
            'Grade Management - Calculate and maintain accurate student grades',
            'Student Evaluation - Assess student performance and provide feedback',
            'Academic Records - Maintain accurate records of student achievements',
            'Improvement Planning - Identify areas for student improvement and intervention',
            'Collaboration - Coordinate with program coordinators on curriculum matters',
            'Professional Development - Stay updated with teaching methodologies and tools'
          ],
          features: [
            'Create formative assessments',
            'Design summative examinations',
            'Define Course Outcomes (COs)',
            'Map COs to Program Outcomes',
            'Create assessment questions',
            'Tag questions with COs',
            'Upload student marks',
            'Calculate final grades',
            'Generate student reports',
            'Track class performance',
            'Identify at-risk students',
            'Provide student feedback',
            'Manage assessment calendars',
            'Review learning outcomes',
            'Collaborate with faculty',
            'Access teaching resources'
          ]
        };

      default:
        return {
          title: 'User Dashboard',
          description: 'Welcome to your personalized workspace',
          stats: [],
          responsibilities: [],
          features: []
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

  const { title, stats, description, responsibilities, features } = getRoleSpecificStats();
  const contextDisplay = getContextDisplay();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>

        {/* Context Display */}
        {(selectedCollege || selectedProgram || selectedBatch) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-800 font-medium">Current Scope:</p>
            <p className="text-sm text-blue-600">{contextDisplay}</p>
          </div>
        )}
      </div>

      {/* Responsibilities Section */}
      {responsibilities && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Responsibilities</h2>
          <ul className="space-y-2">
            {responsibilities.map((responsibility, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold text-xs">{index + 1}</span>
                </div>
                <span className="text-gray-700">{responsibility}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      {features && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feature, index) => (
              <Button key={index} variant="outline" className="justify-start">
                <span className="text-sm">{feature}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

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
        <CourseManagement user={user!} />
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
        {user!.role === 'PROGRAM_COORDINATOR' && user!.programId && user!.batchId && (
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