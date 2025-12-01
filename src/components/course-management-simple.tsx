'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Trash2, AlertTriangle, Edit, ChevronDown, ChevronRight, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CourseEditModal } from '@/components/course-edit-modal';
import { CourseCreation } from '@/components/course-creation';
import { useSidebarContext } from '@/contexts/sidebar-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  status: 'FUTURE' | 'ACTIVE' | 'COMPLETED';
  defaultExpanded?: boolean;
  onUpdateStatus: (courseId: string, newStatus: 'FUTURE' | 'ACTIVE' | 'COMPLETED') => void;
  onDeleteCourse: (courseId: string, courseName: string) => void;
  onEditCourse: (course: Course) => void;
  isHighLevelUser: boolean;
  updatingCourseId?: string;
  deletingCourseId?: string;
}

function CourseCategory({ title, courses, status, defaultExpanded = false, onUpdateStatus, onDeleteCourse, onEditCourse, isHighLevelUser, updatingCourseId, deletingCourseId }: CourseCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const getStatusColor = (courseStatus: string) => {
    switch (courseStatus) {
      case 'FUTURE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      case 'FUTURE':
        return 'bg-gray-50 text-gray-700 border-gray-300';
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-300';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300';
    }
  };

  const isUpdating = (courseId: string) => updatingCourseId === courseId;
  const isDeleting = (courseId: string) => deletingCourseId === courseId;

  const canDeleteCourse = (course: Course) => {
    return course.status === 'FUTURE' || (course.status === 'COMPLETED' && (course._count?.enrollments || 0) === 0);
  };

  return (
    <Card className="mb-4 transition-all duration-300">
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
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg transition-all duration-300 gap-3 sm:gap-0 ${
                    isUpdating(course.id) 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(course.status)} transition-colors duration-300`}>
                      {isUpdating(course.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{course.name}</p>
                      <p className="text-xs text-gray-600">{course.code}</p>
                      <p className="text-xs text-gray-500">{course.batch?.program?.name || 'Unknown Program'} • {course.batch?.name || 'Unknown Batch'}</p>
                      {status === 'ACTIVE' && (course._count?.enrollments || 0) > 0 && (
                        <p className="text-xs text-green-600 font-medium">
                          {course._count?.enrollments || 0} students enrolled
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                    <Badge variant="outline" className="text-xs">{course._count?.enrollments || 0} Students</Badge>
                    <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 text-xs">{course._count?.courseOutcomes || 0} COs</Badge>
                    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">{course._count?.assessments || 0} Assessments</Badge>
                    <Badge className={`text-xs ${getStatusBadgeColor(course.status)}`}>
                      {course.status}
                    </Badge>
                    {isHighLevelUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 hover:border-blue-300 text-blue-600 hover:text-blue-700"
                        onClick={() => onEditCourse(course)}
                        disabled={isUpdating(course.id) || isDeleting(course.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {isHighLevelUser && (
                      <Select
                        value={course.status}
                        onValueChange={(value: 'FUTURE' | 'ACTIVE' | 'COMPLETED') => 
                          onUpdateStatus(course.id, value)
                        }
                        disabled={isUpdating(course.id) || isDeleting(course.id)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          {isUpdating(course.id) ? (
                            <div className="flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Updating...</span>
                            </div>
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FUTURE">Future</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Link href={`/courses/${course.id}/manage`}>
                      <Button variant="outline" size="sm" className="hover:bg-red-50 hover:border-red-300" disabled={isUpdating(course.id) || isDeleting(course.id)}>
                        Manage
                      </Button>
                    </Link>
                    {isHighLevelUser && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={canDeleteCourse(course) ? "hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700" : "text-gray-400 cursor-not-allowed"}
                            disabled={isUpdating(course.id) || isDeleting(course.id) || !canDeleteCourse(course)}
                            title={canDeleteCourse(course) ? "Delete course" : "Cannot delete: Course is active with enrolled students"}
                          >
                            {isDeleting(course.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        {canDeleteCourse(course) && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Delete Course
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{course.name}</strong> ({course.code})?
                                <br /><br />
                                This action cannot be undone and will permanently delete:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>Course information and settings</li>
                                  {(course._count?.courseOutcomes || 0) > 0 && <li>{course._count?.courseOutcomes || 0} course outcomes</li>}
                                  {(course._count?.assessments || 0) > 0 && <li>{course._count?.assessments || 0} assessments</li>}
                                  {(course._count?.enrollments || 0) > 0 && <li>{course._count?.enrollments || 0} student enrollments</li>}
                                </ul>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDeleteCourse(course.id, course.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Course
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        )}
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function CourseManagementAdmin({ user }: { user: User }) {
  const { selectedBatch } = useSidebarContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCourseId, setUpdatingCourseId] = useState<string | undefined>(undefined);
  const [deletingCourseId, setDeletingCourseId] = useState<string | undefined>(undefined);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Build URL based on user role and context
      let url = '/api/courses';
      const params = new URLSearchParams();
      
      // Always use selectedBatch if available
      if (selectedBatch) {
        params.append('batchId', selectedBatch);
      }
      
      // For department users, use their collegeId
      if (user.role === 'DEPARTMENT' && user.collegeId) {
        params.append('collegeId', user.collegeId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('=== FETCHING COURSES FOR ADMIN ===');
      console.log('User:', user);
      console.log('Selected Batch:', selectedBatch);
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Courses fetched:', data.length);
        setCourses(data);
      } else {
        console.error('Failed to fetch courses:', response.status);
        toast.error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Error fetching courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedBatch, user.collegeId, refreshKey]);

  const handleUpdateStatus = async (courseId: string, newStatus: 'FUTURE' | 'ACTIVE' | 'COMPLETED') => {
    try {
      setUpdatingCourseId(courseId);
      
      // Find the current course to get its details for the success message
      const currentCourse = courses.find(c => c.id === courseId);
      const courseName = currentCourse?.name || 'Course';
      
      console.log('=== UPDATING COURSE STATUS ===');
      console.log('Course ID:', courseId);
      console.log('New Status:', newStatus);
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
      });
      
      const fetchPromise = fetch(`/api/courses/${courseId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      console.log('Response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Update successful:', responseData);
        
        // Show appropriate success message based on status change
        if (newStatus === 'ACTIVE') {
          if (responseData.message && responseData.message.includes('automatic enrollment completed')) {
            toast.success(`${courseName} is now active! Automatic enrollment has been processed.`);
          } else {
            const enrolledCount = responseData._count?.enrollments || 0;
            toast.success(`${courseName} is now active! ${enrolledCount > 0 ? `${enrolledCount} students enrolled.` : ''}`);
          }
        } else if (newStatus === 'COMPLETED') {
          toast.success(`${courseName} marked as completed!`);
        } else if (newStatus === 'FUTURE') {
          toast.success(`${courseName} moved to future courses!`);
        }
        
        // Refresh the courses list to show the updated status
        fetchCourses();
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        toast.error(errorData.message || `Failed to update course status`);
      }
    } catch (error) {
      console.error('Error updating course status:', error);
      if (error instanceof Error && error.message === 'Request timeout') {
        toast.error('Request timed out. The course status update may have completed. Please refresh the page.');
      } else {
        toast.error('Error updating course status');
      }
    } finally {
      setUpdatingCourseId(undefined);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    try {
      setDeletingCourseId(courseId);
      
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`${courseName} has been deleted successfully!`);
        fetchCourses(); // Refresh the course list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to delete course`);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(`Network error: Failed to delete course`);
    } finally {
      setDeletingCourseId(undefined);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsEditModalOpen(true);
  };

  const handleCourseUpdated = () => {
    fetchCourses(); // Refresh the course list
    setEditingCourse(null);
    setIsEditModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setEditingCourse(null);
    setIsEditModalOpen(false);
  };

  const handleCourseCreated = () => {
    setRefreshKey(prev => prev + 1);
    setShowCreateForm(false);
    toast.success('Course created successfully!');
  };

  // Group courses by status
  const activeCourses = courses.filter(course => course.status === 'ACTIVE');
  const futureCourses = courses.filter(course => course.status === 'FUTURE');
  const completedCourses = courses.filter(course => course.status === 'COMPLETED');

  // Check if user is high-level user for edit/delete permissions
  const isHighLevelUser = ['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(user.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 lg:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management - {user.role.replace('_', ' ')}</h1>
        </div>
        {isHighLevelUser && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? 'Hide Create Form' : 'Create Course'}
          </Button>
        )}
      </div>

      {/* Course Creation Form */}
      {showCreateForm && (
        <CourseCreation 
          user={user} 
          onCourseCreated={handleCourseCreated}
        />
      )}

      {/* Active Courses */}
      <CourseCategory
        title="Active Courses"
        courses={activeCourses}
        status="ACTIVE"
        defaultExpanded={true}
        onUpdateStatus={handleUpdateStatus}
        onDeleteCourse={handleDeleteCourse}
        onEditCourse={handleEditCourse}
        isHighLevelUser={isHighLevelUser}
        updatingCourseId={updatingCourseId}
        deletingCourseId={deletingCourseId}
      />

      {/* Future Courses */}
      <CourseCategory
        title="Future Courses"
        courses={futureCourses}
        status="FUTURE"
        defaultExpanded={false}
        onUpdateStatus={handleUpdateStatus}
        onDeleteCourse={handleDeleteCourse}
        onEditCourse={handleEditCourse}
        isHighLevelUser={isHighLevelUser}
        updatingCourseId={updatingCourseId}
        deletingCourseId={deletingCourseId}
      />

      {/* Completed Courses */}
      <CourseCategory
        title="Completed Courses"
        courses={completedCourses}
        status="COMPLETED"
        defaultExpanded={false}
        onUpdateStatus={handleUpdateStatus}
        onDeleteCourse={handleDeleteCourse}
        onEditCourse={handleEditCourse}
        isHighLevelUser={isHighLevelUser}
        updatingCourseId={updatingCourseId}
        deletingCourseId={deletingCourseId}
      />
      
      <CourseEditModal
        course={editingCourse}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onCourseUpdated={handleCourseUpdated}
      />
    </div>
  );
}