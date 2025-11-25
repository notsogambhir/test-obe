'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users, Upload, Search, Loader2, Power } from 'lucide-react';
import { toast } from 'sonner';
import { StudentBulkUpload } from '@/components/student-bulk-upload';
import { useAuth } from '@/hooks/use-auth';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { getAuthHeaders } from '@/lib/api-config';

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
  email?: string;
  collegeId?: string;
  college?: {
    id: string;
    name: string;
    code: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  programId?: string;
  program?: {
    id: string;
    name: string;
    code: string;
  };
  batchId?: string;
  batch?: {
    id: string;
    name: string;
    startYear: number;
    endYear: number;
    program: {
      id: string;
      name: string;
      code: string;
    };
  };
  sectionId?: string;
  section?: {
    id: string;
    name: string;
  };
  _count: {
    enrollments: number;
  };
}

interface College {
  id: string;
  name: string;
  code: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  collegeId: string;
}

interface Batch {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  programId: string;
}

interface Section {
  id: string;
  name: string;
  batchId: string;
  batch: {
    id: string;
    name: string;
    program: {
      id: string;
      name: string;
      college: {
        id: string;
        name: string;
        code: string;
      };
    };
  };
  _count: {
    students: number;
  };
}

interface StudentFormData {
  studentId: string;
  name: string;
  email: string;
  password: string;
  collegeId: string;
  programId: string;
  batchId: string;
}

export function StudentManagementAdmin({ user, viewOnly = false }: { user: User; viewOnly?: boolean }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use sidebar context
  const { selectedCollege, selectedProgram, selectedBatch } = useSidebarContext();

  // Fetch colleges
  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  // Fetch programs based on selected college
  const fetchPrograms = async (collegeId: string) => {
    if (!collegeId) return;
    try {
      const response = await fetch(`/api/programs?collegeId=${collegeId}`);
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  // Fetch batches based on selected program
  const fetchBatches = async (programId: string) => {
    if (!programId) return;
    try {
      const response = await fetch(`/api/batches?programId=${programId}`);
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  // Fetch sections
  const fetchSections = async () => {
    try {
      if (selectedBatch) {
        const response = await fetch(`/api/sections?batchId=${selectedBatch}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setSections(Array.isArray(data) ? data : []);
        }
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  // Fetch students with filters
  const fetchStudents = async () => {
    try {
      console.log('=== fetchStudents called ===');
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCollege) params.append('collegeId', selectedCollege);
      if (selectedProgram) params.append('programId', selectedProgram);
      if (selectedBatch) params.append('batchId', selectedBatch);

      console.log('fetchStudents params:', params.toString());
      const response = await fetch(`/api/students?${params}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log('fetchStudents response:', data);
        setStudents(data);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      fetchPrograms(selectedCollege);
    }
  }, [selectedCollege]);

  useEffect(() => {
    if (selectedProgram) {
      fetchBatches(selectedProgram);
    }
  }, [selectedProgram]);

  useEffect(() => {
    fetchStudents();
    fetchSections();
  }, [selectedCollege, selectedProgram, selectedBatch, refreshKey]);

  // Additional effect to ensure refresh after bulk upload
  useEffect(() => {
    if (refreshKey > 0) {
      fetchStudents();
    }
  }, [refreshKey]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent form submission for view-only users
    if (viewOnly) {
      toast.error('You have view-only access and cannot perform this action');
      return;
    }
    
    // Validate that all required fields are selected
    if (!selectedCollege || selectedCollege.trim() === '') {
      toast.error('Please select a college');
      return;
    }
    if (!selectedProgram || selectedProgram.trim() === '') {
      toast.error('Please select a program');
      return;
    }
    if (!selectedBatch || selectedBatch.trim() === '') {
      toast.error('Please select a batch');
      return;
    }
    
    try {
      const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';
      
      console.log('Submitting student data:', {
        studentId: formData.studentId,
        name: formData.name,
        email: formData.email,
        collegeId: selectedCollege,
        programId: selectedProgram,
        batchId: selectedBatch,
      });
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          collegeId: selectedCollege,
          programId: selectedProgram,
          batchId: selectedBatch,
        }),
      });
      
      if (response.ok) {
        toast.success(editingStudent ? 'Student updated successfully!' : 'Student created successfully!');
        setRefreshKey(prev => prev + 1);
        setShowCreateForm(false);
        setEditingStudent(null);
        resetForm();
      } else {
        const errorText = await response.text();
        console.error('Student creation error - Response text:', errorText);
        console.error('Student creation error - Response status:', response.status);
        console.error('Student creation error - Response headers:', Object.fromEntries(response.headers.entries()));
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        toast.error(errorData.error || 'Failed to save student');
      }
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error('Failed to save student');
    }
  };

  // Handle student status toggle
  const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
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

  // Handle student deletion
  const handleDelete = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete student ${studentName}?`)) return;
    
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (response.ok) {
        toast.success('Student deleted successfully!');
        setRefreshKey(prev => prev + 1);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  // Handle edit
  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      name: student.name,
      email: student.email || '',
      password: '',
      collegeId: student.collegeId || selectedCollege || '',
      programId: student.programId || selectedProgram || '',
      batchId: student.batchId || selectedBatch || '',
    });
    setShowCreateForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      studentId: '',
      name: '',
      email: '',
      password: '',
      collegeId: selectedCollege || '',
      programId: selectedProgram || '',
      batchId: selectedBatch || '',
    });
    setEditingStudent(null);
  };

  // Handle bulk upload completion
  const handleBulkUploadComplete = () => {
    console.log('=== handleBulkUploadComplete called ===');
    setRefreshKey(prev => prev + 1);
    setShowBulkUpload(false);
    // Immediately trigger a refresh
    setTimeout(() => {
      fetchStudents();
    }, 100);
  };

  // Check if user can upload students
  const canUploadStudents = selectedCollege && selectedProgram && selectedBatch;

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle section assignment
  const handleSectionChange = async (studentId: string, sectionId: string) => {
    try {
      console.log('=== Section Change Attempt ===');
      console.log('Student ID:', studentId);
      console.log('New Section ID:', sectionId);
      console.log('User role:', user?.role);
      console.log('User collegeId:', user?.collegeId);
      
      const requestBody = { sectionId: sectionId === 'none' || !sectionId ? null : sectionId };
      console.log('Request body:', requestBody);
      
      const authHeaders = getAuthHeaders();
      console.log('Auth headers:', authHeaders);
      
      // Try POST first (for preview environments), fallback to PATCH (for local dev)
      const method = 'POST';
      
      const response = await fetch(`/api/students/${studentId}/section`, {
        method,
        headers: authHeaders,
        credentials: 'include', // Include cookies for local development
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        // Refresh students data
        fetchStudents();
        toast.success('Section Updated: Student section assignment updated successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response data:', errorData);
        toast.error(errorData.error || 'Failed to update student section.');
      }
    } catch (error) {
      console.error('Error updating student section:', error);
      toast.error('Failed to update student section.');
    }
  };

  const [formData, setFormData] = useState<StudentFormData>({
    studentId: '',
    name: '',
    email: '',
    password: '',
    collegeId: '',
    programId: '',
    batchId: '',
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">
            Comprehensive student management across all colleges and programs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (!canUploadStudents) {
                toast.error('You need to select college, program, and batch to upload students.');
                return;
              }
              setShowBulkUpload(!showBulkUpload);
              setShowCreateForm(false);
              resetForm();
            }}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!canUploadStudents}
          >
            <Upload className="h-4 w-4" />
            {showBulkUpload ? 'Cancel' : 'Bulk Upload'}
          </Button>
          <Button
            onClick={() => {
              if (!canUploadStudents) {
                toast.error('You need to select college, program, and batch to add students.');
                return;
              }
              setShowCreateForm(!showCreateForm);
              setShowBulkUpload(false);
              resetForm();
            }}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!canUploadStudents || viewOnly}
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? 'Cancel' : 'Add Student'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-md">
            <Label htmlFor="search">Search Students</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Student Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingStudent ? 'Edit Student' : 'Create New Student'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    placeholder="Enter student ID"
                    value={formData.studentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                    required
                    disabled={!!editingStudent}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter student name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email (optional)"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={editingStudent ? "Leave blank to keep current" : "Enter password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required={!editingStudent}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={viewOnly}>
                  {editingStudent ? 'Update Student' : 'Create Student'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulk Upload */}
      {showBulkUpload && (
        <StudentBulkUpload 
          onStudentsUploaded={handleBulkUploadComplete}
          selectedCollege={selectedCollege || ''}
          selectedProgram={selectedProgram || ''}
          selectedBatch={selectedBatch || ''}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

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
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Email</TableHead>
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
                          {student.college?.code || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {student.program?.code || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.batch?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.batch?.startYear}-{student.batch?.endYear}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!viewOnly && ['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(user.role) ? (
                          <Select
                            value={student.sectionId || 'none'}
                            onValueChange={(value) => handleSectionChange(student.id, value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {sections
                                .filter(section => section.batchId === student.batchId)
                                .map((section) => (
                                  <SelectItem key={section.id} value={section.id}>
                                    {section.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">
                            {student.section?.name || 'None'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{student.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={student.isActive}
                            onCheckedChange={() => handleToggleStatus(student.id, student.isActive)}
                            disabled={viewOnly}
                          />
                          <span className="text-sm">
                            {student.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!viewOnly && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(student)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete student "{student.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(student.id, student.name)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
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