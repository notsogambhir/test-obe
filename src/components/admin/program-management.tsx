'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { GraduationCap, Edit, Trash2, Plus, Users, BookOpen, Calendar, Building2 } from 'lucide-react';

interface College {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  collegeId: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  duration: number;
  description?: string;
  isActive: boolean;
  collegeId: string;
  departmentId?: string;
  college: College;
  department?: Department;
  _count: {
    batches: number;
    users: number;
  };
}

export function ProgramManagement() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    duration: '',
    description: '',
    collegeId: '',
    departmentId: ''
  });

  useEffect(() => {
    fetchPrograms();
    fetchColleges();
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      fetchDepartments(selectedCollege);
    }
  }, [selectedCollege]);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/admin/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch programs",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch programs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/admin/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data);
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    }
  };

  const fetchDepartments = async (collegeId: string) => {
    try {
      const response = await fetch(`/api/admin/departments?collegeId=${collegeId}`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleCreateProgram = async () => {
    if (!formData.name || !formData.code || !formData.collegeId || !formData.duration) {
      toast({
        title: "Error",
        description: "Name, code, college, and duration are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          departmentId: formData.departmentId || null
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Program created successfully",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchPrograms();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create program",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create program",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProgram = async () => {
    if (!selectedProgram || !formData.name || !formData.code || !formData.collegeId || !formData.duration) {
      toast({
        title: "Error",
        description: "Name, code, college, and duration are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/programs/${selectedProgram.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          departmentId: formData.departmentId || null
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Program updated successfully",
        });
        setIsEditDialogOpen(false);
        setSelectedProgram(null);
        resetForm();
        fetchPrograms();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update program",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update program",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProgram = async (program: Program) => {
    if (!confirm(`Are you sure you want to delete ${program.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/programs/${program.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Program deleted successfully",
        });
        fetchPrograms();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete program",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete program",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (program: Program) => {
    setSelectedProgram(program);
    setSelectedCollege(program.collegeId);
    setFormData({
      name: program.name,
      code: program.code,
      duration: program.duration.toString(),
      description: program.description || '',
      collegeId: program.collegeId,
      departmentId: program.departmentId || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      duration: '',
      description: '',
      collegeId: '',
      departmentId: ''
    });
    setSelectedCollege('');
    setDepartments([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading programs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Program Management</h2>
          <p className="text-muted-foreground">Manage academic programs and their details</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={colleges.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Program</DialogTitle>
              <DialogDescription>
                Add a new academic program to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Program Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g., CS"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                {colleges.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                    No colleges available. Please create a college first.
                  </div>
                ) : (
                  <Select
                    value={formData.collegeId}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, collegeId: value, departmentId: '' }));
                      setSelectedCollege(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map((college) => (
                        <SelectItem key={college.id} value={college.id}>
                          {college.name} ({college.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {formData.collegeId && departments.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Select
                    value={formData.departmentId || "none"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Department</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name} ({department.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Years)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the program"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateProgram} disabled={colleges.length === 0}>
                Create Program
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <Card key={program.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                </div>
                <Badge variant={program.isActive ? "default" : "secondary"}>
                  {program.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>
                {program.code} • {program.duration} years
              </CardDescription>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{program.college.name}</span>
              </div>
              {program.department && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{program.department.name}</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {program.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {program.description}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-blue-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-lg font-semibold">{program._count.batches}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Batches</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-purple-600">
                    <Users className="h-4 w-4" />
                    <span className="text-lg font-semibold">{program._count.users}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(program)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteProgram(program)}
                  className="text-red-600 hover:text-red-700"
                  disabled={program._count.batches > 0 || program._count.users > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {programs.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No programs found</h3>
          {colleges.length === 0 ? (
            <>
              <p className="text-muted-foreground mb-4">
                You need to create a college first before adding programs
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Switch to the Colleges tab to create your first college
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first program
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>
              Update program information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Program Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Program Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., CS"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-college">College</Label>
              <Select
                value={formData.collegeId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, collegeId: value, departmentId: '' }));
                  setSelectedCollege(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select college" />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((college) => (
                    <SelectItem key={college.id} value={college.id}>
                      {college.name} ({college.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.collegeId && departments.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department (Optional)</Label>
                <Select
                  value={formData.departmentId || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value === "none" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name} ({department.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (Years)</Label>
              <Input
                id="edit-duration"
                type="number"
                min="1"
                max="10"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the program"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProgram}>
              Update Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}