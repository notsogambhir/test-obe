// Backup current file and recreate with proper structure
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  FileText, 
  Plus, 
  Edit, 
  Upload, 
  CheckCircle, 
  Clock,
  ExternalLink,
  Settings,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Trash2,
  X,
  Download
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { courseEvents } from '@/lib/course-events';
import * as XLSX from 'xlsx';

interface Question {
  id: string;
  question: string;
  maxMarks: number;
  isActive: boolean;
  createdAt: string;
  coMappings: {
    id: string;
    co: {
      id: string;
      code: string;
      description: string;
    };
  }[];
}

interface CourseOutcome {
  id: string;
  code: string;
  description: string;
}

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
  questions?: Question[];
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

interface Section {
  id: string;
  name: string;
  batchId: string;
  _count?: {
    students: number;
  };
}

interface AssessmentsTabProps {
  courseId: string;
  courseData?: any;
  onMarksUploaded?: (assessmentId: string) => void;
}

export function AssessmentsTab({ courseId, courseData }: AssessmentsTabProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [newAssessment, setNewAssessment] = useState({
    name: '',
    type: 'exam' as 'exam' | 'quiz' | 'assignment' | 'project',
    maxMarks: 100,
    weightage: 10,
    sectionId: '' as string
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Question management state for expanded assessment
  const [questions, setQuestions] = useState<Question[]>([]);
  const [cos, setCOs] = useState<CourseOutcome[]>([]);
  const [activeTab, setActiveTab] = useState<'questions' | 'upload'>('questions');
  const [questionForm, setQuestionForm] = useState({
    question: '',
    maxMarks: 10,
    selectedCOs: [] as string[]
  });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [marksUploadStatus, setMarksUploadStatus] = useState<{[key: string]: { hasMarks: boolean; totalQuestions: number; questionsWithMarks: number; percentage: number } }>({});

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('obe-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Always fetch assessments from API to ensure proper filtering for teachers
    // Don't use courseData.assessments as it doesn't filter by teacher assignments
    fetchAssessments();
    
    // Listen for CO updates
    const handleCOUpdate = () => {
      fetchAssessments();
    };
    
    courseEvents.on('co-updated', handleCOUpdate);
    
    return () => {
      courseEvents.off('co-updated', handleCOUpdate);
    };
  }, [courseId]);

  useEffect(() => {
    if (expandedAssessment) {
      fetchQuestions();
      fetchCOs();
    }
  }, [expandedAssessment]);

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  const handleRefreshMarksStatus = async (assessment: Assessment) => {
    const status = await checkMarksUploadStatus(assessment);
    setMarksUploadStatus(prev => ({
      ...prev,
      [assessment.id]: status
    }));
  };

  useEffect(() => {
    if (assessments.length > 0) {
      // Check marks upload status for all assessments
      assessments.forEach(async (assessment) => {
        const status = await checkMarksUploadStatus(assessment);
        setMarksUploadStatus(prev => ({
          ...prev,
          [assessment.id]: status
        }));
      });
    }
  }, [assessments, courseId]);

  const fetchTeacherData = async () => {
    try {
      // Fetch teacher assignments to determine which sections this teacher can manage
      const response = await fetch(`/api/courses/${courseId}/teacher-assignments`);
      if (response.ok) {
        const data = await response.json();
        setTeacherAssignments(data.assignments || []);
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error('Failed to fetch teacher data:', error);
    }
  };

  const fetchAssessments = async () => {
    try {
      const url = `/api/courses/${courseId}/assessments`;
      
      const response = await fetch(url);
      if (response.ok) {
        const assessmentsData = await response.json();
        setAssessments(assessmentsData || []);
      }
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    }
  };

  const fetchQuestions = async () => {
    if (!expandedAssessment) return;
    
    try {
      // Always fetch from API since we're now getting filtered assessments
      const response = await fetch(`/api/courses/${courseId}/assessments/${expandedAssessment}/questions`);
      if (response.ok) {
        const data = await response.json();
        console.log('Questions fetched:', data.length, data);
        console.log('Before setQuestions - current questions count:', questions.length);
        setQuestions(data || []);
        console.log('After setQuestions - new questions count:', (data || []).length);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const fetchCOs = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/cos`);
      if (response.ok) {
        const data = await response.json();
        console.log('COs loaded:', data.length, data);
        setCOs(data || []);
      } else {
        console.error('Failed to fetch COs:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch COs:', error);
    }
  };

  const getAvailableSections = () => {
    if (user?.role === 'TEACHER') {
      // Teachers can only create assessments for their assigned sections
      return sections.filter(section => 
        teacherAssignments.some(a => 
          a.sectionId === section.id && a.teacherId === user.id
        )
      );
    }
    // Admins, PCs, etc. can create assessments for any section
    return sections;
  };

  const handleCreateAssessment = async () => {
    if (!newAssessment.name.trim() || !newAssessment.sectionId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including section",
        variant: "destructive",
      });
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
          sectionId: ''
        });
        setIsCreateDialogOpen(false);
        toast({
          title: "Success",
          description: "Assessment created successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to create assessment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create assessment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssessment = async () => {
    if (!editingAssessment || !editingAssessment.name.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
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
          sectionId: editingAssessment.sectionId,
        }),
      });

      if (response.ok) {
        const updatedAssessment = await response.json();
        setAssessments(prev => 
          prev.map(assessment => 
            assessment.id === updatedAssessment.id ? updatedAssessment : assessment
          )
        );
        setIsCreateDialogOpen(false);
        setEditingAssessment(null);
        // Reset form
        setNewAssessment({
          name: '',
          type: 'exam',
          maxMarks: 100,
          weightage: 10,
          sectionId: ''
        });
        toast({
          title: "Success",
          description: "Assessment updated successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update assessment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assessment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAssessment = async () => {
    if (!assessmentToDelete) return;

    console.log('🗑️ Delete assessment clicked:', assessmentToDelete?.name, 'ID:', assessmentToDelete?.id);
    console.log('📍 Available courseId:', courseId);
    console.log('📍 Available course type:', typeof courseId);

    setLoading(true);
    try {
      const deleteUrl = `/api/courses/${courseId}/assessments/${assessmentToDelete.id}`;
      console.log('🔄 Making DELETE request to:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);

      if (response.ok) {
        await fetchAssessments();
        setShowDeleteDialog(false);
        setAssessmentToDelete(null);
        toast({
          title: "Success",
          description: "Assessment deleted successfully",
        });
      } else {
        const errorData = await response.json();
        console.log('❌ Error response:', errorData);
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete assessment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Exception during delete:', error);
      toast({
        title: "Error",
        description: "Failed to delete assessment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question: question.question,
      maxMarks: question.maxMarks,
      selectedCOs: question.coMappings.map(mapping => mapping.co.id)
    });
    setShowQuestionDialog(true);
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question: '',
      maxMarks: 10,
      selectedCOs: []
    });
  };

  const handleCOSelection = (coId: string, checked: boolean) => {
    setQuestionForm(prev => ({
      ...prev,
      selectedCOs: checked 
        ? [...prev.selectedCOs, coId]
        : prev.selectedCOs.filter(id => id !== coId)
    }));
  };

  const handleBulkQuestionUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process bulk questions
        const questions = jsonData.map((row: any) => ({
          question: row.Question || row.question || '',
          maxMarks: parseInt(row['Max Marks'] || row.maxMarks) || 10,
          coCodes: (row['CO Codes'] || row.coCodes || '').toString().split(',').map((code: string) => code.trim()).filter(Boolean)
        })).filter(q => q.question.trim());

        if (questions.length === 0) {
          toast({
            title: "Error",
            description: "No valid questions found in file",
            variant: "destructive",
          });
          return;
        }

        // Upload questions
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}/assessments/${expandedAssessment}/questions/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questions }),
        });

        if (response.ok) {
          await fetchQuestions();
          toast({
            title: "Success",
            description: `${questions.length} questions uploaded successfully`,
          });
        } else {
          const errorData = await response.json();
          toast({
            title: "Error",
            description: errorData.error || "Failed to upload questions",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process file",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };

  const handleDownloadQuestionTemplate = async () => {
    try {
      // Create Excel template for bulk question upload
      const wb = XLSX.utils.book_new();
      const wsData = [
        ['Question', 'Max Marks', 'CO Codes'],
        ['Sample question text here', '10', 'CO1, CO2'],
        ['Another sample question', '15', 'CO3'],
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Questions Template');
      
      // Download file
      XLSX.writeFile(wb, `Questions_Template.xlsx`);
      
      toast({
        title: "Success",
        description: "Question template downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
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

  const getSectionName = (assessment: Assessment) => {
    if (assessment.section) {
      return assessment.section.name;
    }
    return 'No Section';
  };

  const checkMarksUploadStatus = async (assessment: Assessment) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/assessments/${assessment.id}/questions`);
      if (response.ok) {
        const questions = await response.json();
        // Check if any questions have student marks
        const questionsWithMarks = questions.filter((question: any) => 
          question._count?.studentMarks && question._count.studentMarks > 0
        );
        
        return {
          hasMarks: questionsWithMarks.length > 0,
          totalQuestions: questions.length,
          questionsWithMarks: questionsWithMarks.length,
          percentage: questions.length > 0 ? (questionsWithMarks.length / questions.length) * 100 : 0
        };
      }
    } catch (error) {
      console.error('Error checking marks upload status:', error);
      return {
        hasMarks: false,
        totalQuestions: 0,
        questionsWithMarks: 0,
        percentage: 0
      };
    }
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question.trim() || questionForm.selectedCOs.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in question text and select at least one CO",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const url = editingQuestion 
        ? `/api/courses/${courseId}/assessments/${expandedAssessment}/questions/${editingQuestion.id}`
        : `/api/courses/${courseId}/assessments/${expandedAssessment}/questions`;
      
      const method = editingQuestion ? 'PUT' : 'POST';
      const body = {
        question: questionForm.question.trim(),
        maxMarks: questionForm.maxMarks,
        coIds: questionForm.selectedCOs
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchQuestions();
        resetQuestionForm();
        setShowQuestionDialog(false);
        setEditingQuestion(null);
        toast({
          title: "Success",
          description: `Question ${editingQuestion ? 'updated' : 'created'} successfully`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to save question",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/assessments/${expandedAssessment}/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchQuestions();
        toast({
          title: "Success",
          description: "Question deleted successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete question",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assessments</h2>
          <p className="text-muted-foreground">Manage assessments and questions for this course</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Assessment Creation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}</DialogTitle>
            <DialogDescription>
              {editingAssessment ? 'Update assessment details for this course.' : 'Create a new assessment for this course. Make sure to select the appropriate section.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assessment Name</Label>
              <Input
                id="name"
                value={editingAssessment ? editingAssessment.name : newAssessment.name}
                onChange={(e) => {
                  if (editingAssessment) {
                    setEditingAssessment({ ...editingAssessment, name: e.target.value });
                  } else {
                    setNewAssessment(prev => ({ ...prev, name: e.target.value }));
                  }
                }}
                placeholder="Enter assessment name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={editingAssessment ? editingAssessment.type : newAssessment.type}
                onValueChange={(value) => {
                  if (editingAssessment) {
                    setEditingAssessment({ ...editingAssessment, type: value as any });
                  } else {
                    setNewAssessment(prev => ({ ...prev, type: value as any }));
                  }
                }}
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
                value={editingAssessment ? editingAssessment.maxMarks : newAssessment.maxMarks}
                onChange={(e) => {
                  if (editingAssessment) {
                    setEditingAssessment({ ...editingAssessment, maxMarks: parseInt(e.target.value) });
                  } else {
                    setNewAssessment(prev => ({ ...prev, maxMarks: parseInt(e.target.value) }));
                  }
                }}
                placeholder="Enter max marks"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightage">Weightage (%)</Label>
              <Input
                id="weightage"
                type="number"
                value={editingAssessment ? editingAssessment.weightage : newAssessment.weightage}
                onChange={(e) => {
                  if (editingAssessment) {
                    setEditingAssessment({ ...editingAssessment, weightage: parseFloat(e.target.value) });
                  } else {
                    setNewAssessment(prev => ({ ...prev, weightage: parseFloat(e.target.value) }));
                  }
                }}
                placeholder="Enter weightage percentage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={editingAssessment ? editingAssessment.sectionId : newAssessment.sectionId}
                onValueChange={(value) => {
                  if (editingAssessment) {
                    setEditingAssessment({ ...editingAssessment, sectionId: value });
                  } else {
                    setNewAssessment(prev => ({ ...prev, sectionId: value }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSections().map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setEditingAssessment(null);
              // Reset form when closing
              setNewAssessment({
                name: '',
                type: 'exam',
                maxMarks: 100,
                weightage: 10,
                sectionId: ''
              });
            }}>
              Cancel
            </Button>
            <Button onClick={editingAssessment ? handleUpdateAssessment : handleCreateAssessment} disabled={loading}>
              {loading ? (editingAssessment ? 'Updating...' : 'Creating...') : (editingAssessment ? 'Update Assessment' : 'Create Assessment')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessment List */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment List</CardTitle>
          <CardDescription>
            {user?.role === 'TEACHER' 
              ? 'Assessments for your assigned sections'
              : 'All assessments for this course'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {user?.role === 'TEACHER'
                ? 'No assessments found for your assigned sections. Create your first assessment to get started.'
                : 'No assessments found for this course. Create an assessment to get started.'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="border rounded-lg">
                  <Collapsible
                    open={expandedAssessment === assessment.id}
                    onOpenChange={(open) => setExpandedAssessment(open ? assessment.id : null)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(assessment.type)}`}>
                            {getTypeLabel(assessment.type)}
                          </div>
                          <div>
                            <div className="font-medium">{assessment.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Section: {getSectionName(assessment)} • {assessment.maxMarks} marks • {assessment.weightage}% weight
                            </div>
                            {/* Marks Upload Status Indicator */}
                            {marksUploadStatus[assessment.id] && (
                              <div className="mt-2 flex items-center gap-2">
                                {marksUploadStatus[assessment.id].hasMarks ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                      Marks Uploaded ({marksUploadStatus[assessment.id].questionsWithMarks}/{marksUploadStatus[assessment.id].totalQuestions})
                                    </span>
                                  </>
                                ) : marksUploadStatus[assessment.id].totalQuestions > 0 ? (
                                  <>
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                    <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                                      Pending Upload ({marksUploadStatus[assessment.id].questionsWithMarks}/{marksUploadStatus[assessment.id].totalQuestions})
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRefreshMarksStatus(assessment)}
                                      className="ml-2"
                                    >
                                      <Upload className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 text-gray-400" />
                                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                      No Questions Yet
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAssessment(assessment);
                              setIsCreateDialogOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAssessment(assessment);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedAssessment === assessment.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4">
                      {/* Assessment Actions */}
                      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded">
                        <Button variant="outline" size="sm" onClick={handleDownloadQuestionTemplate}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleBulkQuestionUpload}>
                          <Upload className="h-4 w-4 mr-2" />
                          Bulk Upload Questions
                        </Button>
                        <Button size="sm" onClick={() => setShowQuestionDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAssessment(assessment);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Questions Table */}
                      <div className="border rounded-lg">
                        <div className="p-4 border-b">
                          <h4 className="font-medium">Questions</h4>
                        </div>
                        {questions && questions.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Question</TableHead>
                                <TableHead>Max Marks</TableHead>
                                <TableHead>COs</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {questions.map((question) => (
                                <TableRow key={question.id}>
                                  <TableCell className="max-w-xs">
                                    <div className="truncate" title={question.question}>
                                      {question.question}
                                    </div>
                                  </TableCell>
                                  <TableCell>{question.maxMarks}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {question.coMappings.map((mapping) => (
                                        <Badge key={mapping.co.id} variant="secondary" className="text-xs">
                                          {mapping.co.code}
                                        </Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditQuestion(question)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteQuestion(question.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="p-8 text-center text-muted-foreground">
                            No questions added yet. Click "Add Question" to get started.
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
            <DialogDescription>
              {editingQuestion ? 'Edit question details' : 'Add a new question to this assessment'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <textarea
                id="question"
                value={questionForm.question}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter question text"
                className="w-full h-24 p-2 border rounded-md"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxMarks">Max Marks</Label>
              <Input
                id="maxMarks"
                type="number"
                value={questionForm.maxMarks}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, maxMarks: parseInt(e.target.value) }))}
                placeholder="Enter max marks"
              />
            </div>
            <div className="space-y-2">
              <Label>Course Outcomes (COs)</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {cos.map((co) => (
                  <div key={co.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`co-${co.id}`}
                      checked={questionForm.selectedCOs.includes(co.id)}
                      onChange={(e) => handleCOSelection(co.id, e.target.checked)}
                    />
                    <Label htmlFor={`co-${co.id}`} className="text-sm">
                      {co.code}: {co.description}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={loading}>
              {loading ? 'Saving...' : editingQuestion ? 'Update' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Assessment Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete assessment "{assessmentToDelete?.name}"? This action cannot be undone.
              {assessmentToDelete && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <strong>Note:</strong> You can only delete assessments that have no questions associated with them.
                  If this assessment has questions, please delete the questions first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAssessment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AssessmentsTabSectionAware({ courseId, courseData }: AssessmentsTabProps) {
  return <AssessmentsTab courseId={courseId} courseData={courseData} />;
}