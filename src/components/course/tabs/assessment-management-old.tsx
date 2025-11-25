'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface Question {
  id: string;
  question: string;
  maxMarks: number;
  coId: string;
  co: {
    id: string;
    code: string;
    description: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface CourseOutcome {
  id: string;
  code: string;
  description: string;
}

interface Assessment {
  id: string;
  name: string;
  type: string;
  maxMarks: number;
  weightage: number;
  semester: string;
}

interface AssessmentManagementProps {
  courseId: string;
  assessment: Assessment;
  onClose: () => void;
  onUpdate: () => void;
}

export function AssessmentManagement({ courseId, assessment, onClose, onUpdate }: AssessmentManagementProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [cos, setCOs] = useState<CourseOutcome[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'upload'>('questions');
  
  // Question form state
  const [questionForm, setQuestionForm] = useState({
    question: '',
    maxMarks: 10,
    coId: ''
  });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [templateData, setTemplateData] = useState<any>(null);

  useEffect(() => {
    fetchQuestions();
    fetchCOs();
  }, [assessment.id]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/assessments/${assessment.id}/questions`);
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

  const handleSaveQuestion = async () => {
    if (!questionForm.question.trim() || !questionForm.coId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const url = editingQuestion 
        ? `/api/courses/${courseId}/assessments/${assessment.id}/questions/${editingQuestion.id}`
        : `/api/courses/${courseId}/assessments/${assessment.id}/questions`;
      
      const method = editingQuestion ? 'PUT' : 'POST';
      const body = {
        question: questionForm.question.trim(),
        maxMarks: questionForm.maxMarks,
        coId: questionForm.coId
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
      const response = await fetch(`/api/courses/${courseId}/assessments/${assessment.id}/questions/${questionId}`, {
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
      coId: question.coId
    });
    setShowQuestionDialog(true);
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question: '',
      maxMarks: 10,
      coId: ''
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/assessments/${assessment.id}/template`);
      if (response.ok) {
        const data = await response.json();
        setTemplateData(data);
        
        // Create Excel file
        const wb = XLSX.utils.book_new();
        const wsData = [
          data.template.headers,
          data.template.sampleRow,
          ...data.students.map(student => [
            student.studentId,
            student.name,
            student.email,
            ...data.questions.map(() => '') // Empty marks columns
          ])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');
        
        // Download file
        XLSX.writeFile(wb, `${assessment.name}_Marks_Template.xlsx`);
        
        toast({
          title: "Success",
          description: "Template downloaded successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const handleUploadMarks = async () => {
    if (!uploadFile) {
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

      const response = await fetch(`/api/courses/${courseId}/assessments/${assessment.id}/upload-marks`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: `${result.message}. Processed ${result.processedCount} students.`,
        });
        setUploadFile(null);
        onUpdate(); // Refresh parent data
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Assessment: {assessment.name}
          </DialogTitle>
          <DialogDescription>
            Add questions, map COs, and upload student marks
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Questions & CO Mapping
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload Marks
          </button>
        </div>

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {/* Add Question Button */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {questions.length} questions • Total: {questions.reduce((sum, q) => sum + q.maxMarks, 0)} marks
              </div>
              <Button onClick={() => { resetQuestionForm(); setEditingQuestion(null); setShowQuestionDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {/* Questions Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead>CO Mapping</TableHead>
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
                        <Badge variant="outline">
                          {question.co.code}
                        </Badge>
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
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
          <div className="space-y-6">
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
                    {templateData && (
                      <p className="text-xs text-gray-500 mt-1">
                        {templateData.students.length} students • {templateData.questions.length} questions
                      </p>
                    )}
                  </div>
                  <Button onClick={handleDownloadTemplate}>
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
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <div className="mb-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Click to upload or drag and drop
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            Excel files (.xlsx, .xls) only
                          </span>
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </div>
                      {uploadFile && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600">{uploadFile.name}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUploadFile(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleUploadMarks} 
                    disabled={!uploadFile || uploading}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Marks'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Question Dialog */}
        <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
              <DialogDescription>
                {editingQuestion ? 'Update question details' : 'Create a new question for this assessment'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  placeholder="Enter the question text..."
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxMarks">Max Marks</Label>
                <Input
                  id="maxMarks"
                  type="number"
                  min="1"
                  max="100"
                  value={questionForm.maxMarks}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, maxMarks: parseInt(e.target.value) || 1 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="co">Course Outcome</Label>
                <Select
                  value={questionForm.coId}
                  onValueChange={(value) => setQuestionForm(prev => ({ ...prev, coId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CO" />
                  </SelectTrigger>
                  <SelectContent>
                    {cos.map((co) => (
                      <SelectItem key={co.id} value={co.id}>
                        {co.code}: {co.description.substring(0, 50)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveQuestion} disabled={loading}>
                  {loading ? 'Saving...' : (editingQuestion ? 'Update' : 'Create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}