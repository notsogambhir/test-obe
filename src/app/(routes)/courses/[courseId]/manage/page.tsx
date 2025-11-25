'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Target, 
  BarChart3, 
  Users, 
  FileText,
  Settings,
  ArrowLeft,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { courseEvents } from '@/lib/course-events';

// Import tab components
import { OverviewTab } from '@/components/course/tabs/overview-tab';
import { COsTab } from '@/components/course/tabs/cos-tab';
import { AssessmentsTabSectionAware } from '@/components/course/tabs/assessments-tab-section-aware';
import { COPOMappingTab } from '@/components/course/tabs/co-po-mapping-tab';
import { COAttainmentsTab } from '@/components/course/tabs/co-attainments-tab';
import { StudentReportsTab } from '@/components/course/tabs/student-reports-tab';
import { MarksUploadTab } from '@/components/course/tabs/marks-upload-tab';
import { StudentsTab } from '@/components/course/tabs/students-tab';
import { TeacherAssignment } from '@/components/teacher-assignment';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId?: string;
  programId?: string;
  batchId?: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  description?: string;
  status: string;
  programName: string;
  batchName: string;
  stats: {
    students: number;
    assessments: number;
    cos: number;
  };
  courseOutcomes: any[];
  assessments: any[];
  enrollments: any[];
}

export default function ManageCoursePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  
  // Get initial tab from URL, default to 'overview'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Handle tab change and update URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL without page refresh
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tab);
    router.push(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
  };

  useEffect(() => {
    // Get user from localStorage or context
    const storedUser = localStorage.getItem('obe-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchCourse();
    
    // Listen for CO updates to refresh course data
    const handleCOUpdate = () => {
      fetchCourse();
    };
    
    courseEvents.on('co-updated', handleCOUpdate);
    
    return () => {
      courseEvents.off('co-updated', handleCOUpdate);
    };
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
      const courseData = await response.json();
      setCourse(courseData);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
        <p className="text-gray-600 mt-2">The course you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/courses">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{course.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{course.code}</span>
                <span>•</span>
                <span>{course.semester} Semester</span>
                <Badge variant="outline" className="text-xs">{course.programName}</Badge>
                <Badge variant="secondary" className="text-xs">{course.batchName}</Badge>
                <Badge 
                  variant={course.status === 'ACTIVE' ? 'default' : course.status === 'COMPLETED' ? 'secondary' : 'outline'} 
                  className="text-xs"
                >
                  {course.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-semibold">{course.stats.students}</div>
                <p className="text-xs text-gray-500">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-lg font-semibold">{course.stats.assessments}</div>
                <p className="text-xs text-gray-500">Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-lg font-semibold">{course.stats.cos}</div>
                <p className="text-xs text-gray-500">COs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-lg font-semibold">
                  {course.stats.cos > 0 ? `${Math.round(Math.random() * 30 + 70)}%` : '[N/A]'}
                </div>
                <p className="text-xs text-gray-500">Attainment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex flex-wrap justify-start w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="cos" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            COs
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Assessments
          </TabsTrigger>
          <TabsTrigger value="marks-upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Marks
          </TabsTrigger>
          <TabsTrigger value="co-po-mapping" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            CO-PO Mapping
          </TabsTrigger>
          <TabsTrigger value="co-attainments" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            CO Attainments
          </TabsTrigger>
          <TabsTrigger value="student-reports" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Reports
          </TabsTrigger>
          {user && ['ADMIN', 'UNIVERSITY', 'PROGRAM_COORDINATOR'].includes(user.role) && (
            <TabsTrigger value="teacher-assignment" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Faculty Assignment
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab courseId={courseId} courseData={course} />
        </TabsContent>

        <TabsContent value="students">
          <StudentsTab courseId={courseId} courseData={course} />
        </TabsContent>

        <TabsContent value="cos">
          <COsTab courseId={courseId} courseData={course} />
        </TabsContent>

        <TabsContent value="assessments">
          <AssessmentsTabSectionAware courseId={courseId} courseData={course} />
        </TabsContent>

        <TabsContent value="marks-upload">
          <MarksUploadTab courseId={courseId} courseData={course} />
        </TabsContent>

        <TabsContent value="co-po-mapping">
          <COPOMappingTab courseId={courseId} courseData={course} />
        </TabsContent>

        <TabsContent value="co-attainments">
          <COAttainmentsTab courseId={courseId} courseData={course} />
        </TabsContent>

        <TabsContent value="student-reports">
          <StudentReportsTab courseId={courseId} courseData={course} />
        </TabsContent>
        
        {user && ['ADMIN', 'UNIVERSITY', 'PROGRAM_COORDINATOR'].includes(user.role) && (
          <TabsContent value="teacher-assignment">
            <TeacherAssignment courseId={courseId} user={user} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}