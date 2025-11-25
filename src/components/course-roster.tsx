'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Download, Loader2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  studentId: string;
  studentName: string;
  isActive: boolean;
  program: {
    name: string;
    code: string;
  };
  batch: {
    name: string;
    startYear: number;
    endYear: number;
  };
}

interface EnrollmentRecord {
  enrollmentId: string;
  student: Student;
  enrolledAt: string;
}

interface CourseRosterProps {
  courseId: string;
  courseCode: string;
  courseName: string;
}

interface RosterData {
  roster: EnrollmentRecord[];
  summary: {
    totalEnrolled: number;
    activeStudents: number;
    inactiveStudents: number;
    courseInfo: {
      code: string;
      name: string;
      status: string;
      program: string;
      batch: string;
    };
  };
}

export function CourseRoster({ courseId, courseCode, courseName }: CourseRosterProps) {
  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}/roster`);
      
      if (response.ok) {
        const data = await response.json();
        setRosterData(data);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to fetch course roster');
      }
    } catch (error) {
      console.error('Error fetching roster:', error);
      toast.error('Failed to fetch course roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [courseId, refreshKey]);

  // Filter students based on search term
  const filteredRoster = rosterData?.roster.filter(enrollment =>
    enrollment.student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.student.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleExportRoster = () => {
    if (!rosterData) return;

    // Create CSV content
    const headers = ['Student ID', 'Student Name', 'Status', 'Program', 'Batch', 'Enrolled Date'];
    const rows = filteredRoster.map(enrollment => [
      enrollment.student.studentId,
      enrollment.student.studentName,
      enrollment.student.isActive ? 'Active' : 'Inactive',
      enrollment.student.program.name,
      enrollment.student.batch.name,
      new Date(enrollment.enrolledAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseCode}_roster_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Roster exported successfully!');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!rosterData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Roster Available</h3>
          <p className="text-gray-600">Unable to load course roster.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">{rosterData.summary.totalEnrolled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-green-600">{rosterData.summary.activeStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Students</p>
                <p className="text-2xl font-bold text-red-600">{rosterData.summary.inactiveStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {rosterData.summary.courseInfo.status}
              </Badge>
              <div>
                <p className="text-sm font-medium text-gray-600">Course Status</p>
                <p className="text-sm font-bold text-gray-900">{rosterData.summary.courseInfo.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Course Roster - {rosterData.summary.courseInfo.code}: {rosterData.summary.courseInfo.name}
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {rosterData.summary.courseInfo.program} • {rosterData.summary.courseInfo.batch}
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportRoster}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRoster.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No Students Found' : 'No Students Enrolled'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'This course does not have any enrolled students yet.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoster.map((enrollment) => (
                    <TableRow key={enrollment.enrollmentId}>
                      <TableCell className="font-medium">{enrollment.student.studentId}</TableCell>
                      <TableCell>{enrollment.student.studentName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={enrollment.student.isActive ? "default" : "secondary"}
                          className={enrollment.student.isActive 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {enrollment.student.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {enrollment.student.program.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {enrollment.student.batch.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}