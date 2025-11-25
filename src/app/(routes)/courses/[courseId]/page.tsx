'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Settings, Target, BarChart3, Users, FileText } from 'lucide-react';
import { OverviewTab } from '@/components/course/tabs/overview-tab';
import { COsTab } from '@/components/course/tabs/cos-tab';
import { AssessmentsTab } from '@/components/course/tabs/assessments-tab-new';
import { COPOMappingTab } from '@/components/course/tabs/co-po-mapping-tab';
import { COAttainmentsTab } from '@/components/course/tabs/co-attainments-tab';
import { StudentReportsTab } from '@/components/course/tabs/student-reports-tab';

interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  students: number;
  cos: number;
  assessments: number;
  status: 'active' | 'completed';
}

export default function CourseSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would be an API call
      const mockCourse: Course = {
        id: courseId,
        code: 'CS101',
        name: 'Introduction to Programming',
        semester: '1st',
        students: 60,
        cos: 5,
        assessments: 3,
        status: 'active',
      };
      setCourse(mockCourse);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Course not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
              <p className="text-gray-600">
                {course.code} • {course.semester} Semester
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline">{course.students} Students</Badge>
          <Badge variant="secondary">{course.cos} COs</Badge>
          <Badge variant="outline">{course.assessments} Assessments</Badge>
          <Badge className={course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {course.status}
          </Badge>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Outcomes</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.cos}</div>
            <p className="text-xs text-gray-600">Defined outcomes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.assessments}</div>
            <p className="text-xs text-gray-600">Total assessments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.students}</div>
            <p className="text-xs text-gray-600">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-gray-600">Course progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Settings Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Course Settings
          </CardTitle>
          <CardDescription>
            Manage course outcomes, assessments, and track student performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="cos" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                COs
              </TabsTrigger>
              <TabsTrigger value="assessments" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Assessments
              </TabsTrigger>
              <TabsTrigger value="co-po-mapping" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CO-PO Mapping
              </TabsTrigger>
              <TabsTrigger value="co-attainments" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                CO Attainments
              </TabsTrigger>
              <TabsTrigger value="student-reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Student Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <OverviewTab courseId={courseId} />
            </TabsContent>

            <TabsContent value="cos" className="mt-6">
              <COsTab courseId={courseId} />
            </TabsContent>

            <TabsContent value="assessments" className="mt-6">
              <AssessmentsTab courseId={courseId} />
            </TabsContent>

            <TabsContent value="co-po-mapping" className="mt-6">
              <COPOMappingTab courseId={courseId} />
            </TabsContent>

            <TabsContent value="co-attainments" className="mt-6">
              <COAttainmentsTab courseId={courseId} />
            </TabsContent>

            <TabsContent value="student-reports" className="mt-6">
              <StudentReportsTab courseId={courseId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}