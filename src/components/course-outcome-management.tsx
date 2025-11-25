'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface CourseOutcome {
  id: string;
  code: string;
  description: string;
  isActive: boolean;
  course: {
    id: string;
    code: string;
    name: string;
  };
  _count: {
    mappings: number;
    coAttainments: number;
  };
}

interface Course {
  id: string;
  code: string;
  name: string;
}

export function CourseOutcomeManagement() {
  const [courseOutcomes, setCourseOutcomes] = useState<CourseOutcome[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCO, setEditingCO] = useState<CourseOutcome | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    courseId: '',
    isActive: true
  });

  useEffect(() => {
    fetchCourseOutcomes();
    fetchCourses();
  }, []);

  const fetchCourseOutcomes = async () => {
    try {
      const response = await fetch('/api/course-outcomes');
      if (response.ok) {
        const data = await response.json();
        setCourseOutcomes(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch course outcomes',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch course outcomes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.courseId) {
      toast({
        title: 'Error',
        description: 'Please select a course',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/courses/${formData.courseId}/cos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          isActive: formData.isActive
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Course Outcome created successfully',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchCourseOutcomes();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create course outcome',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create course outcome',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingCO || !formData.courseId) return;

    try {
      const response = await fetch(`/api/courses/${formData.courseId}/cos/${editingCO.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          isActive: formData.isActive
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Course Outcome updated successfully',
        });
        setIsEditDialogOpen(false);
        setEditingCO(null);
        resetForm();
        fetchCourseOutcomes();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update course outcome',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update course outcome',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (co: CourseOutcome) => {
    if (!confirm(`Are you sure you want to delete "${co.code}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${co.course?.id}/cos/${co.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Course Outcome deleted successfully',
        });
        fetchCourseOutcomes();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete course outcome',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete course outcome',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (co: CourseOutcome) => {
    setEditingCO(co);
    setFormData({
      code: co.code,
      description: co.description,
      courseId: co.course.id,
      isActive: co.isActive
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      courseId: '',
      isActive: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Course Outcomes Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Course Outcome</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course Outcome</DialogTitle>
              <DialogDescription>
                Add a new course outcome to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">CO Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Enter CO code (e.g., CO1, CO2)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter detailed description of the course outcome"
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create CO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Course Outcome</DialogTitle>
              <DialogDescription>
                Update course outcome information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-course">Course</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">CO Code</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Enter CO code (e.g., CO1, CO2)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter detailed description of the course outcome"
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Update CO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Outcomes</CardTitle>
          <CardDescription>
            Manage course outcomes and their relationships with assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>CO-PO Mappings</TableHead>
                <TableHead>CO Attainments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseOutcomes.map((co) => (
                <TableRow key={co.id}>
                  <TableCell className="font-medium">{co.code}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={co.description}>
                      {co.description}
                    </div>
                  </TableCell>
                  <TableCell>{co.course.name}</TableCell>
                  <TableCell>{co._count.mappings}</TableCell>
                  <TableCell>{co._count.coAttainments}</TableCell>
                  <TableCell>
                    <Badge variant={co.isActive ? 'default' : 'secondary'}>
                      {co.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(co)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(co)}
                        disabled={co._count.mappings > 0 || co._count.coAttainments > 0}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}