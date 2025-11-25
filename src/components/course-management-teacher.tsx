'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSidebarContext } from '@/contexts/sidebar-context';

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

interface Course {
  id: string;
  code: string;
  name: string;
  status: 'FUTURE' | 'ACTIVE' | 'COMPLETED';
  batch: {
    id: string;
    name: string;
    program: {
      name: string;
      code: string;
    };
  };
  _count: {
    courseOutcomes: number;
    assessments: number;
    enrollments: number;
  };
}

interface CourseCategoryProps {
  title: string;
  courses: Course[];
  status: 'ACTIVE' | 'COMPLETED';
  defaultExpanded?: boolean;
}

function CourseCategory({ title, courses, status, defaultExpanded = false }: CourseCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const getStatusColor = (courseStatus: string) => {
    switch (courseStatus) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (courseStatus: string) => {
    switch (courseStatus) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-300';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <BookOpen className="h-5 w-5" />
            {title} ({courses.length})
          </div>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No {status.toLowerCase()} courses
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                // Skip if course is undefined or invalid
                if (!course || !course.id) {
                  return null;
                }
                
                return (
                <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(course.status)}`}>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{course.name || 'Unknown Course'}</p>
                      <p className="text-xs text-gray-600">{course.code || 'N/A'} • {course.batch?.name || 'Unknown Batch'}</p>
                      <p className="text-xs text-gray-500">{course.batch?.program?.name || 'Unknown Program'} • {course.batch?.name || 'Unknown Batch'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{course._count?.enrollments || 0} Students</Badge>
                    <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 text-xs">{course._count?.courseOutcomes || 0} COs</Badge>
                    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">{course._count?.assessments || 0} Assessments</Badge>
                    <Badge className={`text-xs ${getStatusBadgeColor(course.status)}`}>
                      {course.status}
                    </Badge>
                    <Link href={`/courses/${course.id}/manage`}>
                      <Button variant="outline" size="sm" className="hover:bg-red-50 hover:border-red-300">Manage</Button>
                    </Link>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function CourseManagementTeacher({ user }: { user: User }) {
  const { selectedBatch } = useSidebarContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Use selectedBatch from sidebar context if available, otherwise fallback to user.batchId
      const batchIdToUse = selectedBatch || user.batchId;
      const url = batchIdToUse ? `/api/courses?batchId=${batchIdToUse}` : '/api/courses';
      
      console.log('=== FETCHING COURSES FOR TEACHER ===');
      console.log('User:', user);
      console.log('Selected Batch from sidebar:', selectedBatch);
      console.log('User batchId:', user.batchId);
      console.log('BatchId to use:', batchIdToUse);
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        // Filter out future courses for teachers
        const filteredCourses = data.filter((course: Course) => 
          course.status !== 'FUTURE'
        );
        setCourses(filteredCourses);
      } else {
        console.error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedBatch, user.batchId]);

  // Group courses by status
  const activeCourses = courses.filter(course => course.status === 'ACTIVE');
  const completedCourses = courses.filter(course => course.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Courses</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">
              {user.batchId ? 'No active or completed courses found for this batch.' : 'Please select a batch to view courses.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <CourseCategory
            title="Active Courses"
            courses={activeCourses}
            status="ACTIVE"
            defaultExpanded={true}
          />
          <CourseCategory
            title="Completed Courses"
            courses={completedCourses}
            status="COMPLETED"
            defaultExpanded={false}
          />
        </div>
      )}
    </div>
  );
}