'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  Search, 
  UserPlus,
  Download,
  Mail,
  IdCard
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface Student {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  studentEmail: string;
  enrollmentDate: string;
}

interface StudentsTabProps {
  courseId: string;
  courseData?: any;
}

export function StudentsTab({ courseId, courseData }: StudentsTabProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('obe-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchStudents();
  }, [courseId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/roster`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data || []);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to fetch students",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentRollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const wsData = [
        ['Student ID', 'Name', 'Email', 'Enrollment Date'],
        ...filteredStudents.map(student => [
          student.studentRollNo,
          student.studentName,
          student.studentEmail,
          new Date(student.enrollmentDate).toLocaleDateString()
        ])
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      
      // Download file
      const fileName = courseData?.name 
        ? `${courseData.name.replace(/[^a-zA-Z0-9]/g, '_')}_Students.xlsx`
        : 'Course_Students.xlsx';
      
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Success",
        description: "Student list downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download student list",
        variant: "destructive",
      });
    }
  };

  const canManageStudents = user && ['ADMIN', 'UNIVERSITY', 'PROGRAM_COORDINATOR'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Students</h2>
          <p className="text-gray-600">Manage and view enrolled students</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {filteredStudents.length} Students
          </Badge>
          <Button 
            onClick={handleDownloadExcel}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Excel
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, roll number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enrolled Students
          </CardTitle>
          <CardDescription>
            List of all students enrolled in this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No students found' : 'No students enrolled'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'No students have been enrolled in this course yet'
                }
              </p>
              {canManageStudents && !searchTerm && (
                <Button className="mt-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Students
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    {canManageStudents && (
                      <TableHead className="w-24">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <IdCard className="h-4 w-4 text-gray-400" />
                          {student.studentRollNo}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{student.studentName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{student.studentEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(student.enrollmentDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      {canManageStudents && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Placeholder for student details
                                toast({
                                  title: "Info",
                                  description: "Student details functionality coming soon",
                                });
                              }}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Placeholder for removing student
                                toast({
                                  title: "Info", 
                                  description: "Remove student functionality coming soon",
                                });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-semibold">{students.length}</div>
                <p className="text-xs text-gray-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-lg font-semibold">{filteredStudents.length}</div>
                <p className="text-xs text-gray-500">Filtered Results</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <IdCard className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-lg font-semibold">
                  {students.length > 0 ? Math.max(...students.map(s => {
                    const rollNo = s.studentRollNo.replace(/\\D/g, '');
                    return parseInt(rollNo) || 0;
                  })) : 0}
                </div>
                <p className="text-xs text-gray-500">Highest Roll No</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}