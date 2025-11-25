'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Course {
  id: string;
  code: string;
  name: string;
  status: string;
  batch: {
    name: string;
    program: {
      name: string;
    };
  };
}

export default function TestCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/courses');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.status}`);
        }
        
        const data = await response.json();
        setCourses(data);
        console.log('Courses fetched:', data.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Courses Page</h1>
      
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading courses...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            <p className="font-medium">Debug Info:</p>
            <p>Total courses found: {courses.length}</p>
            <p>Check browser console for more details.</p>
          </div>
          
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {course.code} - {course.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Status:</strong> {course.status}</p>
                  <p><strong>Batch:</strong> {course.batch.name}</p>
                  <p><strong>Program:</strong> {course.batch.program.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}