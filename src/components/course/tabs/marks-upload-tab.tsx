'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
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
  Upload, 
  Download, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Loader2,
  Eye,
  Trash2,
  RefreshCw,
  FileWarning,
  BarChart3,
  Clock,
  TrendingUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
  _count?: {
    questions: number;
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

interface MarksUploadTabProps {
  courseId: string;
  courseData?: any;
  onMarksUploaded?: (assessmentId: string) => void;
}

export function MarksUploadTab({ courseId, courseData, onMarksUploaded }: MarksUploadTabProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [templateData, setTemplateData] = useState<any>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('obe-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchAssessments();
  }, [courseId]);

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  const fetchTeacherData = async () => {
    try {
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

  const getAvailableAssessments = () => {
    if (user?.role === 'TEACHER') {
      return assessments.filter(assessment => 
        teacherAssignments.some(a => 
          a.sectionId === assessment.sectionId && a.teacherId === user.id
        )
      );
    }
    return assessments;
  };

  const handleDownloadTemplate = async (assessmentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}/assessments/${assessmentId}/template`);
      if (response.ok) {
        const data = await response.json();
        setTemplateData(data);
        
        // Create Excel file with enhanced formatting
        const wb = XLSX.utils.book_new();
        
        // Template sheet
        const wsData = [
          data.template.headers,
          ...data.students.map((student: any) => [
            student.studentId,
            student.name,
            student.email,
            ...data.questions.map(() => '') // Empty marks columns
          ])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths
        const colWidths = [
          { wch: 15 }, // Student ID
          { wch: 25 }, // Name
          { wch: 30 }, // Email
          ...data.questions.map(() => ({ wch: 12 })) // Question columns
        ];
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');
        
        // Instructions sheet
        const instructions = [
          ['Instructions for Marks Upload'],
          [''],
          ['1. Fill in the marks for each question in the respective columns'],
          ['2. Marks should be numeric values only'],
          ['3. Do not modify the Student ID, Name, or Email columns'],
          ['4. Save the file as Excel (.xlsx) format'],
          ['5. Upload the filled template using the Upload button'],
          [''],
          ['Question Details:'],
          ...data.questions.map((q: any, index: number) => [
            `Q${index + 1}`,
            q.question.substring(0, 50) + (q.question.length > 50 ? '...' : ''),
            `Max Marks: ${q.maxMarks}`
          ])
        ];
        
        const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
        wsInstructions['!cols'] = [
          { wch: 10 },
          { wch: 60 },
          { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
        
        // Download file
        XLSX.writeFile(wb, `${data.assessment.name}_Marks_Template.xlsx`);
        
        toast({
          title: "Success",
          description: "Template downloaded successfully with instructions",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to download template",
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

  const handleFilePreview = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        setPreviewData({
          fileName: file.name,
          headers: jsonData[0] as string[],
          rows: jsonData.slice(1, 6), // Show first 5 rows as preview
          totalRows: jsonData.length - 1
        });
        setShowPreviewDialog(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to read file preview",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setUploadFile(file);
        handleFilePreview(file);
      } else {
        toast({
          title: "Error",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
      }
    }
  }, [handleFilePreview]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('📁 File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      setUploadFile(file);
      handleFilePreview(file);
    }
  }, [handleFilePreview]);

  const handleUploadMarks = async (assessmentId: string) => {
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Starting marks upload:', {
      assessmentId,
      fileName: uploadFile.name,
      fileSize: uploadFile.size
    });

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      console.log('📤 Sending request to:', `/api/courses/${courseId}/assessments/${assessmentId}/upload-marks`);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/courses/${courseId}/assessments/${assessmentId}/upload-marks`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const result: UploadResult = await response.json();
        console.log('✅ Upload successful:', result);
        setUploadResults(result);
        
        if (onMarksUploaded) {
          onMarksUploaded(assessmentId);
        }
        
        toast({
          title: "Success",
          description: `${result.processedCount} students processed successfully`,
        });
        
        // Reset file input
        setUploadFile(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const errorData = await response.json();
        console.error('❌ Upload failed:', errorData);
        toast({
          title: "Error",
          description: errorData.error || "Failed to upload marks",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload marks",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
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

  const clearUploadResults = () => {
    setUploadResults(null);
    setUploadFile(null);
    setUploadProgress(0);
  };

  const availableAssessments = getAvailableAssessments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload Student Marks</h2>
          <p className="text-gray-600">Download templates and upload marks for assessments</p>
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
          <Badge variant="outline" className="text-sm">
            {availableAssessments.length} Assessments Available
          </Badge>
        </div>
      </div>

      {availableAssessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessments Available</h3>
            <p className="text-gray-600 text-center max-w-md">
              {user?.role === 'TEACHER' 
                ? "You haven't been assigned to any sections yet. Contact your program coordinator."
                : "No assessments have been created yet. Create assessments first to upload marks."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {availableAssessments.map((assessment) => (
            <Card key={assessment.id} className="border shadow-sm">
              <Collapsible
                open={expandedAssessment === assessment.id}
                onOpenChange={(open) => 
                  setExpandedAssessment(open ? assessment.id : null)
                }
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {expandedAssessment === assessment.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{assessment.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge className={getTypeColor(assessment.type)}>
                              {getTypeLabel(assessment.type)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {assessment.maxMarks} marks
                            </span>
                            <span className="text-sm text-gray-500">
                              {assessment.weightage}% weightage
                            </span>
                            {assessment.section && (
                              <Badge variant="outline" className="text-xs">
                                Section {assessment.section.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {assessment._count?.questions || 0} questions
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="upload">Upload Marks</TabsTrigger>
                        <TabsTrigger value="template">Download Template</TabsTrigger>
                        <TabsTrigger value="results">Results</TabsTrigger>
                      </TabsList>

                      {/* Upload Tab */}
                      <TabsContent value="upload" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* File Upload */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Upload className="h-5 w-5" />
                                Upload Marks File
                              </CardTitle>
                              <CardDescription>
                                Upload student marks using the downloaded Excel template
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div
                                  className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                                    dragActive
                                      ? 'border-blue-400 bg-blue-50'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  onDragEnter={handleDrag}
                                  onDragLeave={handleDrag}
                                  onDragOver={handleDrag}
                                  onDrop={handleDrop}
                                >
                                  <div className="text-center">
                                    <FileSpreadsheet className={`h-12 w-12 mx-auto mb-4 ${
                                      dragActive ? 'text-blue-400' : 'text-gray-300'
                                    }`} />
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
                                        className="sr-only"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                      />
                                    </div>
                                    {uploadFile && (
                                      <div className="space-y-2">
                                        <div className="text-sm text-gray-600">
                                          <strong>Selected:</strong> {uploadFile.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Size: {(uploadFile.size / 1024).toFixed(2)} KB
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleFilePreview(uploadFile)}
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          Preview
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {uploading && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span>Uploading...</span>
                                      <span>{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-2" />
                                  </div>
                                )}

                                <Button 
                                  onClick={() => {
                                    console.log('🔘 Upload button clicked for assessment:', assessment.id);
                                    handleUploadMarks(assessment.id);
                                  }}
                                  disabled={!uploadFile || uploading}
                                  className="w-full"
                                >
                                  {uploading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4 mr-2" />
                                  )}
                                  Upload Marks
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Quick Stats */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5" />
                                Upload Statistics
                              </CardTitle>
                              <CardDescription>
                                Current upload status and statistics
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {uploadResults ? (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                      <div className="text-2xl font-bold text-green-600">
                                        {uploadResults.processedCount}
                                      </div>
                                      <p className="text-sm text-gray-600">Processed</p>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                      <div className="text-2xl font-bold text-blue-600">
                                        {uploadResults.totalRows}
                                      </div>
                                      <p className="text-sm text-gray-600">Total Rows</p>
                                    </div>
                                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                                      <div className="text-2xl font-bold text-orange-600">
                                        {uploadResults.errors?.length || 0}
                                      </div>
                                      <p className="text-sm text-gray-600">Errors</p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                      <div className="text-2xl font-bold text-purple-600">
                                        {((uploadResults.processedCount / uploadResults.totalRows) * 100).toFixed(1)}%
                                      </div>
                                      <p className="text-sm text-gray-600">Success Rate</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <Clock className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-sm">No uploads yet</p>
                                  </div>
                                )}
                                
                                {uploadResults && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearUploadResults}
                                    className="w-full"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Clear Results
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Template Tab */}
                      <TabsContent value="template" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Download className="h-5 w-5" />
                              Download Excel Template
                            </CardTitle>
                            <CardDescription>
                              Get a pre-formatted Excel template with all students and questions
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                  <div className="text-lg font-semibold text-blue-600">
                                    {templateData?.students?.length || 'N/A'}
                                  </div>
                                  <p className="text-sm text-gray-600">Students</p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                  <div className="text-lg font-semibold text-green-600">
                                    {templateData?.questions?.length || 'N/A'}
                                  </div>
                                  <p className="text-sm text-gray-600">Questions</p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                                  <div className="text-lg font-semibold text-purple-600">
                                    {assessment.maxMarks}
                                  </div>
                                  <p className="text-sm text-gray-600">Max Marks</p>
                                </div>
                              </div>
                              
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <p className="font-medium mb-1">Template includes:</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                  <li>All enrolled students with ID, Name, and Email</li>
                                  <li>Question columns for marks entry</li>
                                  <li>Instructions sheet with guidelines</li>
                                  <li>Pre-formatted columns for easy data entry</li>
                                </ul>
                              </div>

                              <Button 
                                onClick={() => handleDownloadTemplate(assessment.id)}
                                disabled={loading}
                                className="w-full"
                              >
                                {loading ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4 mr-2" />
                                )}
                                Download Template
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Results Tab */}
                      <TabsContent value="results" className="space-y-4">
                        {uploadResults ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Upload Results
                              </CardTitle>
                              <CardDescription>
                                Detailed results of the last marks upload
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-6">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="text-2xl font-bold text-green-600">
                                      {uploadResults.processedCount}
                                    </div>
                                    <p className="text-sm text-gray-600">Students Processed</p>
                                  </div>
                                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {uploadResults.totalRows}
                                    </div>
                                    <p className="text-sm text-gray-600">Total Rows</p>
                                  </div>
                                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="text-2xl font-bold text-orange-600">
                                      {uploadResults.errors?.length || 0}
                                    </div>
                                    <p className="text-sm text-gray-600">Errors</p>
                                  </div>
                                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {((uploadResults.processedCount / uploadResults.totalRows) * 100).toFixed(1)}%
                                    </div>
                                    <p className="text-sm text-gray-600">Success Rate</p>
                                  </div>
                                </div>

                                {/* Errors Section */}
                                {uploadResults.errors && uploadResults.errors.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4" />
                                      Errors ({uploadResults.errors.length})
                                    </h4>
                                    <ScrollArea className="h-32 w-full">
                                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                        {uploadResults.errors.map((error, index) => (
                                          <div key={index} className="text-sm text-red-700 mb-2 pb-2 border-b border-red-100 last:border-0">
                                            {error}
                                          </div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                )}

                                {/* Warnings Section */}
                                {uploadResults.warnings && uploadResults.warnings.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-orange-600 mb-3 flex items-center gap-2">
                                      <FileWarning className="h-4 w-4" />
                                      Warnings ({uploadResults.warnings.length})
                                    </h4>
                                    <ScrollArea className="h-32 w-full">
                                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                        {uploadResults.warnings.map((warning, index) => (
                                          <div key={index} className="text-sm text-orange-700 mb-2 pb-2 border-b border-orange-100 last:border-0">
                                            {warning}
                                          </div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                              <FileText className="h-12 w-12 text-gray-300 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upload Results</h3>
                              <p className="text-gray-600 text-center max-w-md">
                                Upload marks to see detailed results and statistics here.
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>File Preview: {previewData?.fileName}</DialogTitle>
            <DialogDescription>
              Preview of the first 5 rows from your Excel file
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <ScrollArea className="h-[60vh] w-full">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <strong>Total Rows:</strong> {previewData.totalRows} (showing first 5)
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.headers.map((header: string, index: number) => (
                        <TableHead key={index} className="font-medium">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.rows.map((row: any, rowIndex: number) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell: any, cellIndex: number) => (
                          <TableCell key={cellIndex}>
                            {cell || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}