'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users, Upload, Search, Loader2, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { StudentBulkUpload } from '@/components/student-bulk-upload';

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
  batch?: {
    id: string;
    name: string;
    program: {
      id: string;
      name: string;
      code: string;
    };
  };
  program?: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    enrollments: number;
  };
}

interface StudentFormData {
  studentId: string;
  name: string;
  password: string;
  programId: string;
  batchId: string;
}

export function StudentManagementDepartment({ user }: { user: User }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Add state for selected program and batch (for department users)
  const [selectedProgramId, setSelectedProgramId] = useState<string>(user.programId || '');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(user.batchId || '');

  const [formData, setFormData] = useState<StudentFormData>({
    studentId: '',
    name: '',
    password: '',
    programId: user.programId || '',
    batchId: user.batchId || '',
  });

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Use selected program/batch if user doesn't have pre-assigned ones
      const programIdToUse = selectedProgramId || user.programId;
      const batchIdToUse = selectedBatchId || user.batchId;
      
      if (batchIdToUse) params.append('batchId', batchIdToUse);
      if (programIdToUse) params.append('programId', programIdToUse);
      if (user.collegeId) params.append('collegeId', user.collegeId);
      if (user.departmentId) params.append('departmentId', user.departmentId);

      const response = await fetch(`/api/students?${params}`);
      if (response.ok) {
        const data = await response.json();
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

      // Fetch batches for the selected program (or user's program if assigned)
      const programIdToUse = selectedProgramId || user.programId;
      if (programIdToUse) {
        const batchesResponse = await fetch(`/api/batches?programId=${programIdToUse}`);
        if (batchesResponse.ok) {
          const batchesData = await batchesResponse.json();
          setBatches(batchesData);
        }
      }
    } catch (error) {
      console.error('Error fetching programs and batches:', error);
    }
  };

  // Handle program selection change
  const handleProgramChange = (programId: string) => {
    setSelectedProgramId(programId);
    setSelectedBatchId(''); // Reset batch when program changes
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      programId,
      batchId: '', // Reset batch in form too
    }));
  };

  // Handle batch selection change
  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      batchId,
    }));
  };

  useEffect(() => {
    fetchStudents();
    fetchProgramsAndBatches();
  }, [selectedBatchId, selectedProgramId, user.batchId, user.programId, user.collegeId, user.departmentId, refreshKey]);

  // Fetch batches when program selection changes
  useEffect(() => {
    if (selectedProgramId) {
      fetch(`/api/batches?programId=${selectedProgramId}`)
        .then(res => res.json())
        .then(data => setBatches(data))
        .catch(err => console.error('Error fetching batches:', err));
    }
  }, [selectedProgramId]);

  // Check if user can upload students (has selected or assigned program and batch)
  const canUploadStudents = !!(selectedProgramId || user.programId) && !!(selectedBatchId || user.batchId);
  const programIdToUse = selectedProgramId || user.programId;
  const batchIdToUse = selectedBatchId || user.batchId;

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that program and batch are selected
    if (!formData.programId || formData.programId.trim() === '') {
      toast.error('Please select a program');
      return;
    }

    if (!formData.batchId || formData.batchId.trim() === '') {
      toast.error('Please select a batch');
      return;
    }
    
    try {
      const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';

      console.log('Submitting student data:', formData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingStudent ? 'Student updated successfully!' : 'Student created successfully!');
        setRefreshKey(prev => prev + 1);
        setShowCreateForm(false);
        setEditingStudent(null);
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Student creation error:', errorData);
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

  // Handle student deletion
  const handleDelete = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
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
      password: '',
      programId: student.program?.id || student.batch?.program.id || '',
      batchId: student.batch?.id || '',
    });
    setShowCreateForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      studentId: '',
      name: '',
      password: '',
      programId: programIdToUse || '',
      batchId: batchIdToUse || '',
    });
    setEditingStudent(null);
  };

  // Handle bulk upload completion
  const handleBulkUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
    setShowBulkUpload(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">
            {batchIdToUse ? `Managing students for selected batch` : 'Select a program and batch to manage students'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (!canUploadStudents) {
                toast.error('You need to select a program and batch to upload students.');
                return;
              }
              setShowBulkUpload(!showBulkUpload);
              setShowCreateForm(false);
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
                toast.error('You need to select a program and batch to add students.');
                return;
              }
              setShowCreateForm(!showCreateForm);
              setShowBulkUpload(false);
              resetForm();
            }}
            className="flex items-center gap-2"
            disabled={!canUploadStudents}
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? 'Cancel' : 'Add Student'}
          </Button>
        </div>
      </div>

      {/* Program and Batch Selection */}
      {(!user.programId || !user.batchId) && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Program
                </label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a program...</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Batch
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  disabled={!selectedProgramId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Choose a batch...</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.startYear}-{batch.endYear})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!canUploadStudents && (
              <p className="mt-4 text-sm text-amber-600">
                Please select both a program and batch to enable student management features.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {showBulkUpload && (
        <StudentBulkUpload
          selectedCollege={user?.collegeId || ''}
          selectedProgram={programIdToUse || ''}
          selectedBatch={batchIdToUse || ''}
          onStudentsUploaded={handleBulkUploadComplete}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="e.g. CS101001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Student Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                {!editingStudent && (
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      required={!editingStudent}
                    />
                  </div>
                )}
                {!user.programId && (
                  <div>
                    <Label htmlFor="program">Program *</Label>
                    <Select
                      value={formData.programId}
                      onValueChange={(value) => setFormData({ ...formData, programId: value })}
                    >
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
                )}
                <div>
                  <Label htmlFor="batch">Batch *</Label>
                  <Select
                    value={formData.batchId}
                    onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                  >
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
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStudent ? 'Update Student' : 'Create Student'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({filteredStudents.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
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
                {searchTerm ? 'No students found' : 'No students in this batch'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Add students to get started or select a different batch'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  Add First Student
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrollments</TableHead>
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
                          {student.program?.name || student.batch?.program.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {student.batch?.name || 'N/A'}
                        </Badge>
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
                        <Badge variant="outline">
                          {student._count?.enrollments || 0} courses
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {student.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(student.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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