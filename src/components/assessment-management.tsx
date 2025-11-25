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
import { Switch } from '@/components/ui/switch';

interface Assessment {
  id: string;
  name: string;
  type: 'exam' | 'quiz' | 'assignment' | 'project';
  maxMarks: number;
  weightage: number;
  isActive: boolean;
  course: {
    id: string;
    code: string;
    name: string;
  };
  _count: {
    questions: number;
  };
}

interface Course {
  id: string;
  code: string;
  name: string;
}

export function AssessmentManagement() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'exam',
    maxMarks: '',
    weightage: '',
    courseId: '',
    isActive: true
  });

  useEffect(() => {
    fetchAssessments();
    fetchCourses();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/assessments');
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch assessments',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch assessments',
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

    const assessmentData = {
      name: formData.name,
      type: formData.type,
      maxMarks: parseInt(formData.maxMarks),
      weightage: parseFloat(formData.weightage),
      isActive: formData.isActive
    };

    try {
      const response = await fetch(`/api/courses/${formData.courseId}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessmentData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Assessment created successfully',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchAssessments();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create assessment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create assessment',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingAssessment || !formData.courseId) return;

    const assessmentData = {
      name: formData.name,
      type: formData.type,
      maxMarks: parseInt(formData.maxMarks),
      weightage: parseFloat(formData.weightage),
      isActive: formData.isActive
    };

    try {
      const response = await fetch(`/api/courses/${formData.courseId}/assessments/${editingAssessment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessmentData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Assessment updated successfully',
        });
        setIsEditDialogOpen(false);
        setEditingAssessment(null);
        resetForm();
        fetchAssessments();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update assessment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update assessment',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (assessment: Assessment) => {
    if (!confirm(`Are you sure you want to delete "${assessment.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${assessment.course}/assessments/${assessment.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Assessment deleted successfully',
        });
        fetchAssessments();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete assessment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete assessment',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    const assessmentType = assessment.type as 'exam' | 'quiz' | 'assignment' | 'project';
    setFormData({
      name: assessment.name,
      type: assessmentType,
      maxMarks: assessment.maxMarks.toString(),
      weightage: assessment.weightage.toString(),
      courseId: assessment.course.id,
      isActive: assessment.isActive
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'exam' as const,
      maxMarks: '',
      weightage: '',
      courseId: '',
      isActive: true
    });
  };

  const getAssessmentTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-100 text-red-800';
      case 'quiz': return 'bg-blue-100 text-blue-800';
      case 'assignment': return 'bg-green-100 text-green-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-2xl font-bold">Assessment Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Assessment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Assessment</DialogTitle>
              <DialogDescription>
                Add a new assessment to the system
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
                <Label htmlFor="name">Assessment Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter assessment name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Assessment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assessment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMarks">Max Marks</Label>
                <Input
                  id="maxMarks"
                  type="number"
                  value={formData.maxMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxMarks: e.target.value }))}
                  placeholder="Enter maximum marks"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightage">Weightage (%)</Label>
                <Input
                  id="weightage"
                  type="number"
                  step="0.1"
                  value={formData.weightage}
                  onChange={(e) => setFormData(prev => ({ ...prev, weightage: e.target.value }))}
                  placeholder="Enter weightage percentage"
                  min="0"
                  max="100"
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
              <Button onClick={handleCreate}>Create Assessment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Assessment</DialogTitle>
              <DialogDescription>
                Update assessment information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Assessment Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter assessment name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Assessment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assessment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxMarks">Max Marks</Label>
                <Input
                  id="edit-maxMarks"
                  type="number"
                  value={formData.maxMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxMarks: e.target.value }))}
                  placeholder="Enter maximum marks"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-weightage">Weightage (%)</Label>
                <Input
                  id="edit-weightage"
                  type="number"
                  step="0.1"
                  value={formData.weightage}
                  onChange={(e) => setFormData(prev => ({ ...prev, weightage: e.target.value }))}
                  placeholder="Enter weightage percentage"
                  min="0"
                  max="100"
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
              <Button onClick={handleUpdate}>Update Assessment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
          <CardDescription>
            Manage assessments and their relationships with courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Max Marks</TableHead>
                <TableHead>Weightage</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-medium">{assessment.name}</TableCell>
                  <TableCell>
                    <Badge className={getAssessmentTypeColor(assessment.type)}>
                      {assessment.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{assessment.course.name}</TableCell>
                  <TableCell>{assessment.maxMarks}</TableCell>
                  <TableCell>{assessment.weightage}%</TableCell>
                  <TableCell>{assessment._count.questions}</TableCell>
                  <TableCell>
                    <Badge variant={assessment.isActive ? 'default' : 'secondary'}>
                      {assessment.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(assessment)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(assessment)}
                        disabled={assessment._count.questions > 0}
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