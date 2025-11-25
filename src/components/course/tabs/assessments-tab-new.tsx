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
  questions?: Question[];
}

interface AssessmentsTabProps {
  courseId: string;
  courseData?: any;
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
  });
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (courseData?.assessments) {
      setAssessments(courseData.assessments);
    } else {
      fetchAssessments();
    }
    
    // Listen for CO updates
    const handleCOUpdate = () => {
      fetchAssessments();
    };
    
    courseEvents.on('co-updated', handleCOUpdate);
    
    return () => {
      courseEvents.off('co-updated', handleCOUpdate);
    };
  }, [courseId, courseData]);

  useEffect(() => {
    if (expandedAssessment) {
      fetchQuestions();
      fetchCOs();
    }
  }, [expandedAssessment]);

  const fetchAssessments = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/assessments`);
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
      const assessment = assessments.find(a => a.id === expandedAssessment);
      if (assessment?.questions) {
        setQuestions(assessment.questions);
        return;
      }

      const response = await fetch(`/api/courses/${courseId}/assessments/${expandedAssessment}/questions`);
      if (response.ok) {
        const data = await response.json();
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

  const handleCreateAssessment = async () => {
    if (!newAssessment.name.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
        }),
      });

      if (response.ok) {
        const createdAssessment = await response.json();
        setAssessments(prev => [...prev, createdAssessment]);
        setNewAssessment({ 
          name: '', 
          type: 'exam', 
          maxMarks: 100, 
          weightage: 10
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
            description: "No valid questions found in the file",
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

  return (
    <div className="space-y-6">
      {/* Header with Create Assessment Button */}
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
          </div>
        </CardHeader>
      </Card>

      {/* Assessments List with Dropdown */}
      <div className="space-y-4">
        {assessments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessments</h3>
              <p className="text-gray-600 mb-4">
                Create your first assessment to start tracking student performance
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Assessment
              </Button>
            </CardContent>
          </Card>
        ) : (
          assessments.map((assessment) => (
            <Card key={assessment.id} className="overflow-hidden">
              <Collapsible
                open={expandedAssessment === assessment.id}
                onOpenChange={(open) => setExpandedAssessment(open ? assessment.id : null)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        {expandedAssessment === assessment.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">{assessment.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getTypeColor(assessment.type)}>
                              {getTypeLabel(assessment.type)}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {assessment.maxMarks} marks • {assessment.weightage}% weightage
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle upload marks
                        }}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="border-t">
                  {/* Tab Navigation */}
                  <div className="flex space-x-1 border-b bg-gray-50 px-6">
                    <button
                      onClick={() => setActiveTab('questions')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'questions'
                          ? 'border-blue-500 text-blue-600 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Questions & CO Mapping
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'upload'
                          ? 'border-blue-500 text-blue-600 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Upload Marks
                    </button>
                  </div>

                  {/* Questions Tab */}
                  {activeTab === 'questions' && (
                    <div className="p-6 space-y-4">
                      {/* Question Actions */}
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          {questions.length} questions • Total: {questions.reduce((sum, q) => sum + q.maxMarks, 0)} marks
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadQuestionTemplate}
                          >
                            <FileSpreadsheet className="h-3 w-3 mr-1" />
                            Template
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkQuestionUpload}
                            disabled={loading}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Bulk Upload
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              resetQuestionForm();
                              setEditingQuestion(null);
                              setShowQuestionDialog(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Question
                          </Button>
                        </div>
                      </div>

                      {/* Questions Table */}
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8">#</TableHead>
                              <TableHead>Question</TableHead>
                              <TableHead>Max Marks</TableHead>
                              <TableHead>CO Mappings</TableHead>
                              <TableHead className="w-24">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {questions.map((question, index) => (
                              <TableRow key={question.id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>
                                  <div className="max-w-md">
                                    <p className="text-sm">{question.question}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{question.maxMarks}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {question.coMappings.map((mapping) => (
                                      <Badge key={mapping.id} variant="outline">
                                        {mapping.co.code}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditQuestion(question)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteQuestion(question.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {questions.length === 0 && (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-4">
                              <FileText className="h-12 w-12 mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions</h3>
                            <p className="text-gray-600 mb-4">
                              Add questions to this assessment to start tracking student performance
                            </p>
                            <Button onClick={() => setShowQuestionDialog(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Question
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upload Tab */}
                  {activeTab === 'upload' && (
                    <div className="p-6 space-y-6">
                      {/* Template Download */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            Download Template
                          </CardTitle>
                          <CardDescription>
                            Download an Excel template with student IDs and question columns
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Template includes all enrolled students and question columns
                              </p>
                            </div>
                            <Button>
                              <Download className="h-4 w-4 mr-2" />
                              Download Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Upload Marks */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Upload Marks
                          </CardTitle>
                          <CardDescription>
                            Upload student marks using the downloaded Excel template
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                              <div className="text-center">
                                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                  Upload Marks File
                                </p>
                                <p className="text-sm text-gray-600 mb-4">
                                  Select the Excel file with student marks
                                </p>
                                <Button>
                                  Select File
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>

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

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion ? 'Edit the question details' : 'Add a new question to this assessment'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-text">Question</Label>
              <textarea
                id="question-text"
                className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                placeholder="Enter the question text..."
                value={questionForm.question}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-marks">Max Marks</Label>
              <Input
                id="max-marks"
                type="number"
                min="1"
                max="100"
                value={questionForm.maxMarks}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, maxMarks: parseInt(e.target.value) || 10 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Course Outcomes (COs)</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {cos.map((co) => (
                  <div key={co.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={co.id}
                      checked={questionForm.selectedCOs.includes(co.id)}
                      onChange={(e) => handleCOSelection(co.id, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={co.id} className="text-sm cursor-pointer flex-1">
                      <span className="font-medium">{co.code}</span>
                      <span className="text-gray-600 ml-2">{co.description}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuestion} disabled={loading}>
                {loading ? 'Saving...' : (editingQuestion ? 'Update' : 'Save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}