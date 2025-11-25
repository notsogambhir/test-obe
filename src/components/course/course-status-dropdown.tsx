'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { useCourseStore } from '@/lib/store/courseStore';
import { Course } from '@/types/course';

interface CourseStatusDropdownProps {
  course: Course;
}

export function CourseStatusDropdown({ course }: CourseStatusDropdownProps) {
  const { updateCourseStatus, isLoading } = useCourseStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'FUTURE':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleStatusChange = async (newStatus: 'FUTURE' | 'ACTIVE' | 'COMPLETED') => {
    if (newStatus === course.status) return;
    
    try {
      await updateCourseStatus(course.id, newStatus);
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleStatusChange('FUTURE')}
          disabled={course.status === 'FUTURE'}
        >
          <Badge className={`mr-2 ${getStatusColor('FUTURE')}`}>
            Future
          </Badge>
          Set as Future
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange('ACTIVE')}
          disabled={course.status === 'ACTIVE'}
        >
          <Badge className={`mr-2 ${getStatusColor('ACTIVE')}`}>
            Active
          </Badge>
          Set as Active
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange('COMPLETED')}
          disabled={course.status === 'COMPLETED'}
        >
          <Badge className={`mr-2 ${getStatusColor('COMPLETED')}`}>
            Completed
          </Badge>
          Set as Completed
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}