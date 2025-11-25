'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';

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

interface CourseEditModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onCourseUpdated: () => void;
}

export function CourseEditModal({ course, isOpen, onClose, onCourseUpdated }: CourseEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when course changes
  React.useEffect(() => {
    if (course) {
      setFormData({
        name: course.name,
        code: course.code,
      });
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course) return;

    // Basic validation
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Course name and code are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-HTTP-Method-Override': 'PATCH',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
        }),
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        responseData = { message: responseText };
      }

      if (response.ok) {
        toast.success('Course updated successfully!');
        onCourseUpdated();
        onClose();
      } else {
        if (responseData.details && Array.isArray(responseData.details)) {
          // Validation errors
          const errorMessages = responseData.details.map((err: any) => 
            `${err.field}: ${err.message}`
          ).join(', ');
          toast.error(`Validation failed: ${errorMessages}`);
        } else {
          toast.error(responseData.error || responseData.message || 'Failed to update course');
        }
      }
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Network error: Failed to update course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Course
          </DialogTitle>
          <DialogDescription>
            Update the course information for <strong>{course.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Course Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="e.g., CS101"
              maxLength={20}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Unique identifier for the course (e.g., CS101, MATH201)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Course Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Introduction to Programming"
              maxLength={255}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Full name of the course as it will appear in the system
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Current Course Info:</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {course.code} • {course.name}
            </p>
            <p className="text-xs text-gray-500">
              {course.batch.program.name} • {course.batch.name}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Course'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}