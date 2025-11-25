'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Search, Loader2, Eye, Filter, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { StudentDetailsModal } from './student-details-modal';

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

interface Student {
  id: string;
  studentId: string;
  name: string;
  role: string;
  isActive: boolean;
  sectionId?: string;
  section?: {
    id: string;
    name: string;
  };
  program?: {
    id: string;
    name: string;
    code: string;
  };
  batch?: {
    id: string;
    name: string;
    startYear: number;
    endYear: number;
  };
  _count: {
    enrollments: number;
  };
}

export function StudentManagementTeacher({ user }: { user: User }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProgram) params.append('programId', selectedProgram);
      if (selectedBatch) params.append('batchId', selectedBatch);
      if (user.collegeId) params.append('collegeId', user.collegeId);
      if (user.departmentId) params.append('departmentId', user.departmentId);

      const response = await fetch(`/api/students?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        console.error('Failed to fetch students');
        toast.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Error fetching students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch programs and batches
  const fetchProgramsAndBatches = async () => {
    try {
      if (user.collegeId) {
        const programsResponse = await fetch(`/api/programs?collegeId=${user.collegeId}`);
        if (programsResponse.ok) {
          const programsData = await programsResponse.json();
          setPrograms(programsData);
        }
      }

      if (selectedProgram) {
        const batchesResponse = await fetch(`/api/batches?programId=${selectedProgram}`);
        if (batchesResponse.ok) {
          const batchesData = await batchesResponse.json();
          setBatches(batchesData);
        }
      }
    } catch (error) {
      console.error('Error fetching programs and batches:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedProgram, selectedBatch]);

  useEffect(() => {
    fetchProgramsAndBatches();
  }, [selectedProgram, user.collegeId]);

  // Filter students based on search term and status
  useEffect(() => {
    let filtered = students;

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(student => student.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(student => !student.isActive);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, statusFilter]);

  // Handle view student details
  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  // Handle student status toggle
  const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        const updatedStudent = await response.json();
        setStudents(prev => 
          prev.map(student => 
            student.id === studentId 
              ? { ...student, isActive: updatedStudent.isActive }
              : student
          )
        );
        toast.success(`Student ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update student status');
      }
    } catch (error) {
      console.error('Error updating student status:', error);
      toast.error('Failed to update student status');
    }
  };

  // Handle program change
  const handleProgramChange = (programId: string) => {
    setSelectedProgram(programId);
    setSelectedBatch(''); // Reset batch when program changes
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
          <p className="text-gray-600">
            View student information and enrollment details
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="program">Program</Label>
              <Select value={selectedProgram} onValueChange={handleProgramChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="batch">Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.startYear}-{batch.endYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No students found' : 'No students available'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Select a program and batch to view students'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.studentId}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.program?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {student.batch?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.section ? (
                          <Badge variant="outline">
                            {student.section.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={student.isActive ? "default" : "secondary"}>
                            {student.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title={`${student.isActive ? 'Deactivate' : 'Activate'} student`}
                              >
                                {student.isActive ? (
                                  <PowerOff className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {student.isActive ? 'Deactivate Student' : 'Activate Student'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {student.isActive ? 'deactivate' : 'activate'} student "{student.name}" ({student.studentId})?
                                  {student.isActive && ' This will prevent the student from accessing the system.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleToggleStatus(student.id, student.isActive)}
                                  className={student.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                                >
                                  {student.isActive ? 'Deactivate' : 'Activate'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Details Modal */}
      <StudentDetailsModal
        student={selectedStudent}
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedStudent(null);
        }}
        userRole={user.role}
      />
    </div>
  );
}