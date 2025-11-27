'use client';

// Enhanced assessments tab with integrated marks upload functionality
import { useState, useEffect, useCallback } from 'react';
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
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { courseEvents } from '@/lib/course-events';

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

interface UploadResult {
  processedCount: number;
  totalRows: number;
  errors?: string[];
  warnings?: string[];
  uploadedMarks?: any[];
}

interface AssessmentsTabProps {
  courseId: string;
  courseData?: any;
  onMarksUploaded?: (assessmentId: string) => void;
}

export function AssessmentsTabSectionAware({ courseId, courseData }: AssessmentsTabProps) {
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
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [marksUploadStatus, setMarksUploadStatus] = useState<{[key: string]: { hasMarks: boolean; totalQuestions: number; questionsWithMarks: number; percentage: number } }>({});
  
  // Marks upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult | null>(null);
  const [showMarksDialog, setShowMarksDialog] = useState(false);
  const [uploadedMarks, setUploadedMarks] = useState<any>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [currentAssessmentForUpload, setCurrentAssessmentForUpload] = useState<Assessment | null>(null);
  
  // Bulk question upload state
  const [bulkQuestionFile, setBulkQuestionFile] = useState<File | null>(null);
  const [bulkUploadResults, setBulkUploadResults] = useState<any>(null);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [showDeleteQuestionDialog, setShowDeleteQuestionDialog] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('obe-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Always fetch assessments from API to ensure proper filtering for teachers
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
        setQuestions(data || []);
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
        setCOs(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch COs:', error);
    }
  };

  const checkMarksUploadStatus = async (assessment: Assessment) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/assessments/${assessment.id}/marks-status`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error checking marks upload status:', error);
    }
    return { hasMarks: false, totalQuestions: 0, questionsWithMarks: 0, percentage: 0 };
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

  const getSectionName = (assessment: Assessment) => {
    return assessment.section?.name || 'No Section';
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

    setLoading(true);
    try {
      const deleteUrl = `/api/courses/${courseId}/assessments/${assessmentToDelete.id}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

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
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete assessment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assessment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Marks upload functions
  const handleDownloadMarksTemplate = async (assessmentId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Starting CSV template download for assessment:', assessmentId);
      
      const response = await fetch(`/api/courses/${courseId}/assessments/${assessmentId}/template`);
      console.log('📥 Template API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Template data received:', {
          assessment: data.assessment?.name,
          hasTemplate: !!data.template,
          hasStudents: !!data.students,
          hasQuestions: !!data.questions,
          studentsCount: data.students?.length,
          questionsCount: data.questions?.length,
          headers: data.template?.headers
        });
        
        if (!data.template || !data.students || !data.questions) {
          console.error('❌ Template data is incomplete');
          toast({
            title: "Error",
            description: "Template data is incomplete",
            variant: "destructive",
          });
          return;
        }
        
        // Create CSV content
        const headers = data.template.headers;
        const csvContent = [
          headers.join(','),
          ...data.students.map((student: any) => [
            student.studentId,
            student.name,
            student.email,
            ...data.questions.map(() => '') // Empty marks columns
          ].join(','))
        ].join('\n');
        
        console.log('📄 CSV content generated (first 200 chars):', csvContent.substring(0, 200));
        console.log('📄 CSV content length:', csvContent.length);
        
        // Download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.assessment.name}_Marks_Template.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ CSV download initiated successfully for:', data.assessment.name);
        
        toast({
          title: "Success",
          description: "CSV template downloaded successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to generate template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMarksClick = (assessment: Assessment) => {
    // Always open upload dialog for marks upload (initial or replacement)
    setCurrentAssessmentForUpload(assessment);
    setShowMarksDialog(true);
    setUploadResults(null);
    setUploadFile(null);
    setUploadedMarks(null); // Clear any existing marks view
  };

  const handleViewMarksClick = (assessment: Assessment) => {
    // Only open view dialog for viewing existing marks
    setCurrentAssessmentForUpload(assessment);
    setUploadFile(null);
    setUploadResults(null);
    handleViewUploadedMarks(assessment.id);
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      
      // Read and preview CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim());
          const rows = lines.slice(1, 6).map(line => 
            line.split(',').map(cell => cell.trim())
          );
          
          setPreviewData({
            fileName: file.name,
            headers,
            rows,
            totalRows: lines.length - 1
          });
          setShowPreviewDialog(true);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const handleUploadMarks = async () => {
    if (!uploadFile || !currentAssessmentForUpload) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch(`/api/courses/${courseId}/assessments/${currentAssessmentForUpload.id}/upload-marks`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result: UploadResult = await response.json();
        setUploadResults(result);
        
        toast({
          title: "Success",
          description: `${result.processedCount} students processed successfully`,
        });
        
        // Refresh marks status
        if (currentAssessmentForUpload) {
          await handleRefreshMarksStatus(currentAssessmentForUpload);
        }
        
        // Reset and close dialog
        setUploadFile(null);
        setShowMarksDialog(false);
        setCurrentAssessmentForUpload(null);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to upload marks",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload marks",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleViewUploadedMarks = async (assessmentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}/assessments/${assessmentId}/uploaded-marks`);
      if (response.ok) {
        const data = await response.json();
        setUploadedMarks(data);
        setShowMarksDialog(true);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to fetch uploaded marks",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch uploaded marks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Question management functions
  const handleDownloadQuestionTemplate = async (assessmentId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/courses/${courseId}/assessments/${assessmentId}/template`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data.questions || data.questions.length === 0) {
          toast({
            title: "Error",
            description: "No questions found for this assessment",
            variant: "destructive",
          });
          return;
        }
        
        // Create CSV content for questions
        const csvContent = [
          ['Question', 'Max Marks', 'CO Codes'],
          ...data.questions.map((q: any) => [
            `"${q.question.replace(/"/g, '""')}"`, // Escape quotes
            q.maxMarks,
            q.coMappings.map((m: any) => m.co.code).join(';')
          ])
        ].join('\n');
        
        // Download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.assessment.name}_Questions_Template.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "Questions template downloaded successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to download questions template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download questions template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkQuestionUpload = (assessmentId: string) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    if (assessment) {
      setCurrentAssessmentForUpload(assessment);
      setShowBulkUploadDialog(true);
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
      const body = editingQuestion 
        ? {
            question: questionForm.question.trim(),
            maxMarks: questionForm.maxMarks,
            coIds: questionForm.selectedCOs
          }
        : {
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
        setQuestionForm({ question: '', maxMarks: 10, selectedCOs: [] });
        setEditingQuestion(null);
        setShowQuestionDialog(false);
        toast({
          title: "Success",
          description: `Question ${editingQuestion ? 'updated' : 'created'} successfully`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || `Failed to ${editingQuestion ? 'update' : 'create'} question`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingQuestion ? 'update' : 'create'} question`,
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
      selectedCOs: question.coMappings.map(m => m.co.id)
    });
    setShowQuestionDialog(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestionToDelete(questionId);
    setShowDeleteQuestionDialog(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/assessments/${expandedAssessment}/questions/${questionToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchQuestions();
        setShowDeleteQuestionDialog(false);
        setQuestionToDelete(null);
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
    } finally {
      setLoading(false);
    }
  };

  const handleBulkQuestionUploadSubmit = async () => {
    if (!bulkQuestionFile || !currentAssessmentForUpload) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const text = await bulkQuestionFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validate headers
      if (!headers.includes('Question') || !headers.includes('Max Marks')) {
        toast({
          title: "Error",
          description: "Invalid CSV format. Required columns: Question, Max Marks",
          variant: "destructive",
        });
        return;
      }

      const questions: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length >= 2 && values[0]) {
          questions.push({
            question: values[0],
            maxMarks: parseInt(values[1]) || 10,
            coCodes: values[2] ? values[2].split(';').filter(c => c.trim()) : []
          });
        }
      }

      if (questions.length === 0) {
        toast({
          title: "Error",
          description: "No valid questions found in CSV file",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/courses/${courseId}/assessments/${currentAssessmentForUpload.id}/questions/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions }),
      });

      if (response.ok) {
        const result = await response.json();
        setBulkUploadResults(result);
        await fetchQuestions();
        toast({
          title: "Success",
          description: result.message || "Questions uploaded successfully",
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
        description: "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'quiz': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assignment': return 'bg-green-100 text-green-800 border-green-200';
      case 'project': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assessments Management</h2>
          <p className="text-gray-600">Create assessments, manage questions, and upload student marks</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssessments}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        </div>
      </div>

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
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
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
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedAssessment === assessment.id ? 'rotate-180' : ''}`} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4">
                      {/* Assessment Actions */}
                      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadMarksTemplate(assessment.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download CSV Template
                        </Button>
                        
                        {/* View Marks Button - always visible but disabled if no marks exist */}
                        <Button
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewMarksClick(assessment)}
                          disabled={!marksUploadStatus[assessment.id]?.hasMarks}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Marks
                        </Button>
                        
                        {/* Upload Marks Button - always visible for initial upload or replacement */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUploadMarksClick(assessment)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {marksUploadStatus[assessment.id]?.hasMarks ? 'Replace Marks' : 'Upload Marks'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadQuestionTemplate(assessment.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Question Template
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBulkQuestionUpload(assessment.id)}>
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
                          onClick={() => {
                            setEditingAssessment(assessment);
                            setIsCreateDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Assessment
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteAssessment(assessment)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Assessment
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

      {/* Upload/View Marks Dialog */}
      <Dialog open={showMarksDialog} onOpenChange={(open) => {
        setShowMarksDialog(open);
        if (!open) {
          setUploadedMarks(null);
          setUploadResults(null);
          setUploadFile(null);
          setCurrentAssessmentForUpload(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {uploadedMarks ? 'View Uploaded Marks' : 'Upload Student Marks'}
            </DialogTitle>
            <DialogDescription>
              {uploadedMarks 
                ? 'View uploaded marks for this assessment (read-only)'
                : currentAssessmentForUpload && marksUploadStatus[currentAssessmentForUpload.id]?.hasMarks
                  ? 'Upload new marks to replace all existing marks for this assessment'
                  : 'Upload marks for students in this assessment'
              }
            </DialogDescription>
          </DialogHeader>
          
          {uploadedMarks ? (
            // Display uploaded marks
            <div className="space-y-4">
              {uploadedMarks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      {uploadedMarks[0].questions?.map((q: any, index: number) => (
                        <TableHead key={index}>Q{index + 1}</TableHead>
                      ))}
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedMarks.map((student: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        {student.questions?.map((marks: number | null, qIndex: number) => (
                          <TableCell key={qIndex}>{marks ?? '-'}</TableCell>
                        ))}
                        <TableCell className="font-medium">
                          {student.questions?.reduce((sum: number, marks: number | null) => sum + (marks ?? 0), 0) || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No marks have been uploaded yet.
                </div>
              )}
            </div>
          ) : (
            // Upload form
            <div className="space-y-4">
              {currentAssessmentForUpload && (
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium">{currentAssessmentForUpload.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Section: {getSectionName(currentAssessmentForUpload)} • {currentAssessmentForUpload.maxMarks} marks
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select CSV File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>

              {uploadFile && (
                <div className="p-4 bg-blue-50 rounded">
                  <p className="text-sm font-medium">Selected file: {uploadFile.name}</p>
                  <p className="text-sm text-muted-foreground">Size: {(uploadFile.size / 1024).toFixed(2)} KB</p>
                </div>
              )}

              {uploadResults && (
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm font-medium text-green-800">
                    Upload completed successfully!
                  </p>
                  <p className="text-sm text-green-700">
                    {uploadResults.processedCount} students processed
                  </p>
                  {uploadResults.errors && uploadResults.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-800">Errors:</p>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {uploadResults.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {uploadResults.errors.length > 5 && (
                          <li>... and {uploadResults.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowMarksDialog(false);
                  setUploadedMarks(null);
                  setUploadResults(null);
                  setUploadFile(null);
                  setCurrentAssessmentForUpload(null);
                }}>
                  {uploadedMarks ? 'Close' : 'Cancel'}
                </Button>
                {!uploadedMarks && (
                  <Button onClick={handleUploadMarks} disabled={!uploadFile || uploading}>
                    {uploading ? 'Uploading...' : 'Upload Marks'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
            <DialogDescription>
              Preview of CSV file: {previewData?.fileName}
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total rows: {previewData.totalRows}
              </div>
              
              <div className="border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.headers.map((header: string, index: number) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.rows.map((row: string[], rowIndex: number) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Assessment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
            </DialogTitle>
            <DialogDescription>
              {editingAssessment ? 'Edit assessment details' : 'Create a new assessment for this course'}
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
                    setNewAssessment({ ...newAssessment, name: e.target.value });
                  }
                }}
                placeholder="Enter assessment name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={editingAssessment ? editingAssessment.type : newAssessment.type}
                onValueChange={(value: 'exam' | 'quiz' | 'assignment' | 'project') => {
                  if (editingAssessment) {
                    setEditingAssessment({ ...editingAssessment, type: value });
                  } else {
                    setNewAssessment({ ...newAssessment, type: value });
                  }
                }}
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
              <Label htmlFor="maxMarks">Max Marks</Label>
              <Input
                id="maxMarks"
                type="number"
                value={editingAssessment ? editingAssessment.maxMarks : newAssessment.maxMarks}
                onChange={(e) => {
                  if (editingAssessment) {
                    setEditingAssessment({ ...editingAssessment, maxMarks: parseInt(e.target.value) || 0 });
                  } else {
                    setNewAssessment({ ...newAssessment, maxMarks: parseInt(e.target.value) || 0 });
                  }
                }}
                placeholder="Enter maximum marks"
                min="1"
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
                    setEditingAssessment({ ...editingAssessment, weightage: parseInt(e.target.value) || 0 });
                  } else {
                    setNewAssessment({ ...newAssessment, weightage: parseInt(e.target.value) || 0 });
                  }
                }}
                placeholder="Enter weightage percentage"
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={editingAssessment ? editingAssessment.sectionId : newAssessment.sectionId}
                onValueChange={(value: string) => {
                  if (editingAssessment) {
                    setEditingAssessment({ ...editingAssessment, sectionId: value });
                  } else {
                    setNewAssessment({ ...newAssessment, sectionId: value });
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
              setNewAssessment({ name: '', type: 'exam', maxMarks: 100, weightage: 10, sectionId: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={editingAssessment ? handleUpdateAssessment : handleCreateAssessment} disabled={loading}>
              {loading ? 'Saving...' : (editingAssessment ? 'Update' : 'Create')}
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
              Are you sure you want to delete "{assessmentToDelete?.name}"? This action cannot be undone and will also delete all associated questions and marks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAssessment} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question Create/Edit Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion ? 'Edit question details' : 'Add a new question to this assessment'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <textarea
                id="question"
                className="w-full min-h-[100px] p-3 border rounded-md resize-y"
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                placeholder="Enter question text"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxMarks">Max Marks</Label>
              <Input
                id="maxMarks"
                type="number"
                value={questionForm.maxMarks}
                onChange={(e) => setQuestionForm({ ...questionForm, maxMarks: parseInt(e.target.value) || 0 })}
                placeholder="Enter maximum marks"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Course Outcomes (COs)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                {cos.map((co) => (
                  <div key={co.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`co-${co.id}`}
                      checked={questionForm.selectedCOs.includes(co.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setQuestionForm({ ...questionForm, selectedCOs: [...questionForm.selectedCOs, co.id] });
                        } else {
                          setQuestionForm({ ...questionForm, selectedCOs: questionForm.selectedCOs.filter(id => id !== co.id) });
                        }
                      }}
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
            <Button variant="outline" onClick={() => {
              setShowQuestionDialog(false);
              setEditingQuestion(null);
              setQuestionForm({ question: '', maxMarks: 10, selectedCOs: [] });
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={loading}>
              {loading ? 'Saving...' : (editingQuestion ? 'Update' : 'Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Question Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Questions</DialogTitle>
            <DialogDescription>
              Upload questions from a CSV file. Format: Question, Max Marks, CO Codes (semicolon separated)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {currentAssessmentForUpload && (
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-medium">{currentAssessmentForUpload.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Section: {getSectionName(currentAssessmentForUpload)} • {currentAssessmentForUpload.maxMarks} marks
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="bulk-file">Select CSV File</Label>
              <Input
                id="bulk-file"
                type="file"
                accept=".csv"
                onChange={(e) => setBulkQuestionFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>

            {bulkQuestionFile && (
              <div className="p-4 bg-blue-50 rounded">
                <p className="text-sm font-medium">Selected file: {bulkQuestionFile.name}</p>
                <p className="text-sm text-muted-foreground">Size: {(bulkQuestionFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            {bulkUploadResults && (
              <div className="p-4 bg-green-50 rounded">
                <p className="text-sm font-medium text-green-800">
                  Upload completed successfully!
                </p>
                <p className="text-sm text-green-700">
                  {bulkUploadResults.questions?.length || 0} questions processed
                </p>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm font-medium mb-2">CSV Format Example:</p>
              <div className="text-xs font-mono bg-white p-2 rounded border">
                Question,Max Marks,CO Codes<br/>
                "What is a process?",10,"CO1"<br/>
                "Explain deadlock prevention",15,"CO1;CO2"
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowBulkUploadDialog(false);
              setBulkQuestionFile(null);
              setBulkUploadResults(null);
              setCurrentAssessmentForUpload(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleBulkQuestionUploadSubmit} disabled={!bulkQuestionFile || uploading}>
              {uploading ? 'Uploading...' : 'Upload Questions'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Question Confirmation Dialog */}
      <AlertDialog open={showDeleteQuestionDialog} onOpenChange={setShowDeleteQuestionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuestion} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper function to download blob
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}