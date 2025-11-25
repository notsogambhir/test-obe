import { create } from 'zustand';
import { Course } from '@/types/course';

// Helper function to get auth headers
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  
  const storedUser = localStorage.getItem('obe-user');
  if (!storedUser) return {};

  try {
    const user = JSON.parse(storedUser);
    const token = btoa(JSON.stringify(user));
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    } as Record<string, string>;
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    return {
      'Content-Type': 'application/json',
    } as Record<string, string>;
  }
};

interface CourseStore {
  courses: Course[];
  selectedCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCourses: (batchId: string) => Promise<void>;
  selectCourse: (course: Course) => void;
  clearSelectedCourse: () => void;
  createCourse: (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'students' | 'cos' | 'assessments'>) => Promise<Course>;
  updateCourseStatus: (courseId: string, status: 'FUTURE' | 'ACTIVE' | 'COMPLETED') => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  clearError: () => void;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  selectedCourse: null,
  isLoading: false,
  error: null,

  fetchCourses: async (batchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/courses?batchId=${batchId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const courses = await response.json();
      set({ courses, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch courses',
        isLoading: false 
      });
    }
  },

  selectCourse: (course: Course) => {
    set({ selectedCourse: course });
  },

  clearSelectedCourse: () => {
    set({ selectedCourse: null });
  },

  createCourse: async (courseData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }

      const newCourse = await response.json();
      
      // Add to local state
      set(state => ({
        courses: [newCourse, ...state.courses],
        isLoading: false
      }));

      return newCourse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create course';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw error;
    }
  },

  updateCourseStatus: async (courseId: string, status: 'FUTURE' | 'ACTIVE' | 'COMPLETED') => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update course status');
      }

      const updatedCourse = await response.json();
      
      // Update local state
      set(state => ({
        courses: state.courses.map(course => 
          course.id === courseId ? updatedCourse : course
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update course status',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteCourse: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      // Remove from local state
      set(state => ({
        courses: state.courses.filter(course => course.id !== courseId),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete course',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));