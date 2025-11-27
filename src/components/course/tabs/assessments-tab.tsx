'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FileText, 
  Plus, 
  Edit, 
  Upload, 
  CheckCircle, 
  Clock,
  ExternalLink,
  Settings,
  Users
} from 'lucide-react';
import { toast } from '@/components/ui/toaster-simple';
import { courseEvents } from '@/lib/course-events';
import Link from 'next/link';
import { AssessmentManagement } from './assessment-management-new';
import { useAuth } from '@/hooks/use-auth';

interface Assessment {
  id: string;
  name: string;
  type: 'exam' | 'quiz' | 'assignment' | 'project';
  maxMarks: number;
  weightage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sectionId?: string;
  section?: {
    id: string;
    name: string;
  };
}

interface Section {
  id: string;
  name: string;
  batchId: string;
  _count?: {
    students: number;
  };
}

interface TeacherAssignment {
  id: string;
  courseId: string;
  sectionId?: string;
  teacherId: string;
  isActive: boolean;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
}

interface AssessmentsTabProps {
  courseId: string;
  courseData?: any;
}

export function AssessmentsTab({ courseId, courseData }: AssessmentsTabProps) {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showManagementDialog, setShowManagementDialog] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [newAssessment, setNewAssessment] = useState({
    name: '',
    type: 'exam' as 'exam' | 'quiz' | 'assignment' | 'project',
    maxMarks: 100,
    weightage: 10,
    sectionId: '' as string,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (courseData?.assessments) {
      setAssessments(courseData.assessments);
    } else {
      fetchAssessments();
    }
    
    // Fetch sections and teacher assignments
    fetchSectionsAndAssignments();
    
    // Listen for CO updates (in case assessments need to refresh CO-related data)
    const handleCOUpdate = () => {
      fetchAssessments();
      fetchSectionsAndAssignments();
    };
    
    courseEvents.on('co-updated', handleCOUpdate);
    
    return () => {
      courseEvents.off('co-updated', handleCOUpdate);
    };
  }, [courseId, courseData]);

  const fetchSectionsAndAssignments = async () => {
    try {
      // Fetch sections for this course
      const sectionsResponse = await fetch(`/api/courses/${courseId}/sections`);
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        setSections(sectionsData || []);
      }

      // Fetch teacher assignments
      const assignmentsResponse = await fetch(`/api/courses/${courseId}/teacher-assignments`);
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setTeacherAssignments(assignmentsData.assignments || []);
      }
    } catch (error) {
      console.error('Failed to fetch sections and assignments:', error);
    }
  };

  const fetchAssessments = async () => {
    try {
      let url = `/api/courses/${courseId}/assessments`;
      
      // If user is a teacher, filter by their assigned sections
      if (user?.role === 'TEACHER') {
        const teacherSections = teacherAssignments
          .filter(ta => ta.teacherId === user.id && ta.sectionId)
          .map(ta => ta.sectionId);
        
        if (teacherSections.length > 0) {
          url += `?sectionIds=${teacherSections.join(',')}`;
        }
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const assessmentsData = await response.json();
        setAssessments(assessmentsData || []);
      }
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    }
  };

  const handleCreateAssessment = async () => {
    if (!newAssessment.name.trim() || !newAssessment.sectionId) {
      toast.error(
        "Error",
        "Please fill in all required fields including section"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAssessment.name.trim(),
          type: newAssessment.type,
          maxMarks: newAssessment.maxMarks,
          weightage: newAssessment.weightage,
          sectionId: newAssessment.sectionId,
        }),
      });

      if (response.ok) {
        const createdAssessment = await response.json();
        setAssessments(prev => [...prev, createdAssessment]);
        setNewAssessment({ 
          name: '', 
          type: 'exam', 
          maxMarks: 100, 
          weightage: 10,
          sectionId: '',
        });
        setIsCreateDialogOpen(false);
        toast.success(
          "Success",
          "Assessment created successfully"
        );
      } else {
        const errorData = await response.json();
        toast.error(
          "Error",
          errorData.error || "Failed to create assessment"
        );
      }
    } catch (error) {
      toast.error(
        "Error",
        "Failed to create assessment"
      );
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-100 text-red-800';
      case 'quiz': return 'bg-blue-100 text-blue-800';
      case 'assignment': return 'bg-green-100 text-green-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'exam': return 'Exam';
      case 'quiz': return 'Quiz';
      case 'assignment': return 'Assignment';
      case 'project': return 'Project';
      default: return type;
    }
  };

  const handleManageAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowManagementDialog(true);
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setIsEditDialogOpen(true);
  };

  const handleAssessmentUpdate = () => {
    fetchAssessments();
    setShowManagementDialog(false);
    setSelectedAssessment(null);
  };

  const handleUpdateAssessment = async () => {
    if (!editingAssessment || !editingAssessment.name.trim()) {
      toast.error(
        "Error",
        "Please fill in all required fields"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/assessments/${editingAssessment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingAssessment.name.trim(),
          type: editingAssessment.type,
          maxMarks: editingAssessment.maxMarks,
          weightage: editingAssessment.weightage,
          isActive: editingAssessment.isActive,
        }),
      });

      if (response.ok) {
        const updatedAssessment = await response.json();
        setAssessments(prev => 
          prev.map(assessment => 
            assessment.id === updatedAssessment.id ? updatedAssessment : assessment
          )
        );
        setIsEditDialogOpen(false);
        setEditingAssessment(null);
        toast.success(
          "Success",
          "Assessment updated successfully"
        );
      } else {
        const errorData = await response.json();
        toast.error(
          "Error",
          errorData.error || "Failed to update assessment"
        );
      }
    } catch (error) {
      toast.error(
        "Error",
        "Failed to update assessment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Assessments</CardTitle>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assessment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Assessment</DialogTitle>
                  <DialogDescription>
                    Create a new assessment
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assessment-name">Assessment Name</Label>
                    <Input
                      id="assessment-name"
                      placeholder="e.g., Mid Term Examination"
                      value={newAssessment.name}
                      onChange={(e) => setNewAssessment(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessment-type">Type</Label>
                    <Select
                      value={newAssessment.type}
                      onValueChange={(value: 'exam' | 'quiz' | 'assignment' | 'project') => 
                        setNewAssessment(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label htmlFor="assessment-section">Section</Label>
                    <Select
                      value={newAssessment.sectionId}
                      onValueChange={(value: string) => 
                        setNewAssessment(prev => ({ ...prev, sectionId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            Section {section.name} ({section._count?.students || 0} students)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total-marks">Total Marks</Label>
                    <Input
                      id="total-marks"
                      type="number"
                      min="1"
                      max="1000"
                      value={newAssessment.maxMarks}
                      onChange={(e) => setNewAssessment(prev => ({ 
                        ...prev, 
                        maxMarks: parseInt(e.target.value) || 100 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weightage">Weightage (%)</Label>
                    <Input
                      id="weightage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newAssessment.weightage}
                      onChange={(e) => setNewAssessment(prev => ({ 
                        ...prev, 
                        weightage: parseFloat(e.target.value) || 10 
                      }))}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAssessment} disabled={loading}>
                      {loading ? 'Creating...' : 'Create Assessment'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Assessment Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Assessment</DialogTitle>
                  <DialogDescription>
                    Update assessment details
                  </DialogDescription>
                </DialogHeader>
                {editingAssessment && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-assessment-name">Assessment Name</Label>
                      <Input
                        id="edit-assessment-name"
                        placeholder="e.g., Mid Term Examination"
                        value={editingAssessment.name}
                        onChange={(e) => setEditingAssessment(prev => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-assessment-type">Type</Label>
                      <Select
                        value={editingAssessment.type}
                        onValueChange={(value: 'exam' | 'quiz' | 'assignment' | 'project') => 
                          setEditingAssessment(prev => prev ? { ...prev, type: value } : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                      <Label htmlFor="edit-assessment-section">Section</Label>
                      <Select
                        value={editingAssessment.sectionId || ''}
                        onValueChange={(value: string) => 
                          setEditingAssessment(prev => prev ? { ...prev, sectionId: value } : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Sections</SelectItem>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              Section {section.name} ({section._count?.students || 0} students)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-total-marks">Total Marks</Label>
                      <Input
                        id="edit-total-marks"
                        type="number"
                        min="1"
                        max="1000"
                        value={editingAssessment.maxMarks}
                        onChange={(e) => setEditingAssessment(prev => prev ? { 
                          ...prev, 
                          maxMarks: parseInt(e.target.value) || 100 
                        } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-weightage">Weightage (%)</Label>
                      <Input
                        id="edit-weightage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editingAssessment.weightage}
                        onChange={(e) => setEditingAssessment(prev => prev ? { 
                          ...prev, 
                          weightage: parseFloat(e.target.value) || 10 
                        } : null)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateAssessment} disabled={loading}>
                        {loading ? 'Updating...' : 'Update Assessment'}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessments</h3>
              <p className="text-gray-600 mb-4">
                Create your first assessment to start tracking student performance
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Assessment
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment Name</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Weightage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">
                        {assessment.name}
                      </TableCell>
                      <TableCell>
                        {assessment.section ? (
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            Section {assessment.section.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">All Sections</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(assessment.type)}>
                          {getTypeLabel(assessment.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{assessment.maxMarks}</TableCell>
                      <TableCell>{assessment.weightage}%</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditAssessment(assessment)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleManageAssessment(assessment)}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                          <Button size="sm" variant="outline">
                            <Upload className="h-3 w-3 mr-1" />
                            Upload
                          </Button>
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-3">
          <CardHeader className="pb-2 px-0 pt-0">
            <CardTitle className="text-xs font-medium">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="text-xl font-bold">{assessments.length}</div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="pb-2 px-0 pt-0">
            <CardTitle className="text-xs font-medium">Exams</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="text-xl font-bold">
              {assessments.filter(a => a.type === 'exam').length}
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="pb-2 px-0 pt-0">
            <CardTitle className="text-xs font-medium">Assignments</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="text-xl font-bold">
              {assessments.filter(a => a.type === 'assignment').length}
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="pb-2 px-0 pt-0">
            <CardTitle className="text-xs font-medium">Total Weightage</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="text-xl font-bold">
              {assessments.reduce((sum, a) => sum + a.weightage, 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <CardHeader className="px-0 pt-0 pb-3">
          <CardTitle className="text-red-600">[PLACEHOLDER] Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Bulk Upload Marks</p>
                  <p className="text-sm text-gray-600">Upload marks from Excel file</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Upload
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Generate Reports</p>
                  <p className="text-sm text-gray-600">Create assessment reports</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Management Dialog */}
      {selectedAssessment && (
        <AssessmentManagement
          courseId={courseId}
          assessment={selectedAssessment}
          onClose={() => {
            setShowManagementDialog(false);
            setSelectedAssessment(null);
          }}
          onUpdate={handleAssessmentUpdate}
        />
      )}
    </div>
  );
}