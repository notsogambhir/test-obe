'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, BookOpen, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
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

interface CourseCreationProps {
  user: User;
  onCourseCreated?: () => void;
}

export function CourseCreation({ user, onCourseCreated }: CourseCreationProps) {
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCourses, setExistingCourses] = useState<string[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [isBatchValid, setIsBatchValid] = useState(true);
  const { selectedBatch } = useSidebarContext();

  // Fetch existing courses when batch changes
  useEffect(() => {
    if (selectedBatch) {
      fetchExistingCourses();
      validateSelectedBatch();
    }
  }, [selectedBatch]);

  const validateSelectedBatch = async () => {
    if (!selectedBatch) return;
    
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const batches = await response.json();
        setAvailableBatches(batches);
        const isValid = batches.some((batch: any) => batch.id === selectedBatch);
        setIsBatchValid(isValid);
        
        if (!isValid) {
          console.warn('Selected batch is not valid:', selectedBatch);
        }
      }
    } catch (error) {
      console.error('Error validating batch:', error);
    }
  };

  const fetchExistingCourses = async () => {
    try {
      const response = await fetch(`/api/courses?batchId=${selectedBatch}`);
      if (response.ok) {
        const courses = await response.json();
        const courseCodes = courses.map((course: any) => course.code);
        setExistingCourses(courseCodes);
      }
    } catch (error) {
      console.error('Error fetching existing courses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseCode.trim() || !courseName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    // Check for duplicate course code
    if (isCourseCodeDuplicate) {
      toast.error(`Course code "${courseCode.toUpperCase()}" already exists in this batch`);
      return;
    }

    // Check if user has a batch selected (from sidebar global state)
    if (!selectedBatch) {
      toast.error("Please select a batch from the sidebar before creating a course");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Creating course with data:', {
        code: courseCode.toUpperCase(),
        name: courseName.trim(),
        batchId: selectedBatch,
      });
      
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: courseCode.toUpperCase(),
          name: courseName.trim(),
          batchId: selectedBatch,
        }),
      });

      console.log('Course creation response status:', response.status);
      console.log('Course creation response ok:', response.ok);

      if (response.ok) {
        console.log('Course created successfully, calling onCourseCreated callback');
        toast.success("Course created successfully");
        setCourseCode('');
        setCourseName('');
        onCourseCreated?.();
        console.log('onCourseCreated callback called');
      } else {
        const error = await response.json();
        console.error('Course creation failed:', error);
        
        // Handle specific error messages
        if (error.error?.includes('Foreign key constraint violated')) {
          toast.error("Invalid batch selected. Please select a valid batch from the sidebar.");
        } else if (error.error?.includes('duplicate')) {
          toast.error("A course with this code already exists in this batch.");
        } else {
          toast.error(error.error || error.message || "Failed to create course");
        }
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error("Failed to create course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasBatchSelected = !!selectedBatch;
  const isCourseCodeDuplicate = existingCourses.includes(courseCode.toUpperCase());
  const canCreateCourse = hasBatchSelected && isBatchValid && !isCourseCodeDuplicate;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">Create New Course</CardTitle>
        <CardDescription>
          Add a new course to your program
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Existing Courses Info */}
        {hasBatchSelected && existingCourses.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Existing course codes in this batch:</p>
                <p className="text-xs mt-1">{existingCourses.join(', ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Batch Status */}
        <div className="mb-6">
          {hasBatchSelected ? (
            isBatchValid ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Info className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Course will be created for your currently selected batch
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Invalid batch selected</p>
                  <p className="text-xs">Please select a valid batch from the sidebar. Your current selection is no longer available.</p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Please select a batch from the sidebar to create courses
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseCode">Course Code</Label>
            <Input
              id="courseCode"
              type="text"
              placeholder="e.g., CS101"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              required
              disabled={!hasBatchSelected}
              className={isCourseCodeDuplicate ? "border-red-500 focus:border-red-500" : ""}
            />
            {isCourseCodeDuplicate && (
              <p className="text-xs text-red-600">
                This course code already exists in this batch
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              type="text"
              placeholder="e.g., Introduction to Computer Science"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
              disabled={!hasBatchSelected}
            />
          </div>

          <div className="flex justify-center">
            <Button 
              type="submit"
              disabled={isSubmitting || !canCreateCourse}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Course
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}