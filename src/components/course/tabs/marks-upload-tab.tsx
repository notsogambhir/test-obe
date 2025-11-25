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
  Upload, 
  Download, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Loader2
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
  const [templateData, setTemplateData] = useState<any>(null);
  const [uploadResults, setUploadResults] = useState<any>(null);

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

  const getAvailableAssessments = () => {
    if (user?.role === 'TEACHER') {
      // Teachers can only see assessments for their assigned sections
      return assessments.filter(assessment => 
        teacherAssignments.some(a => 
          a.sectionId === assessment.sectionId && a.teacherId === user.id
        )
      );
    }
    // Admins, PCs, etc. can see all assessments
    return assessments;
  };

  const handleDownloadTemplate = async (assessmentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}/assessments/${assessmentId}/template`);
      if (response.ok) {
        const data = await response.json();
        setTemplateData(data);
        
        // Create Excel file
        const wb = XLSX.utils.book_new();
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
        XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');
        
        // Download file
        XLSX.writeFile(wb, `${data.assessment.name}_Marks_Template.xlsx`);
        
        toast({
          title: "Success",
          description: "Template downloaded successfully",
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

  const handleUploadMarks = async (assessmentId: string) => {
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

      const response = await fetch(`/api/courses/${courseId}/assessments/${assessmentId}/upload-marks`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResults(result);
        
        // Call the callback to notify parent component
        if (onMarksUploaded) {
          onMarksUploaded(assessmentId);
        }
        
        toast({
          title: "Success",
          description: `${result.message}. Processed ${result.processedCount} students.`,
        });
        setUploadFile(null);
        
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
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

  const availableAssessments = getAvailableAssessments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload Student Marks</h2>
          <p className="text-gray-600">Download templates and upload marks for assessments</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {availableAssessments.length} Assessments Available
        </Badge>
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
            <Card key={assessment.id} className="border">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Template Download */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Download className="h-5 w-5" />
                            Download Template
                          </CardTitle>
                          <CardDescription>
                            Download an Excel template with student IDs and question columns
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-sm text-gray-600">
                              Template includes all enrolled students and question columns for easy marks entry.
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

                      {/* Upload Marks */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Upload className="h-5 w-5" />
                            Upload Marks
                          </CardTitle>
                          <CardDescription>
                            Upload student marks using the downloaded Excel template
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                              <div className="text-center">
                                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-gray-300" />
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
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                  />
                                </div>
                                {uploadFile && (
                                  <div className="text-sm text-gray-600">
                                    Selected: {uploadFile.name}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleUploadMarks(assessment.id)}
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
                    </div>

                    {/* Upload Results */}
                    {uploadResults && uploadResults.processedCount > 0 && (
                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Upload Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {uploadResults.processedCount}
                                </div>
                                <p className="text-sm text-gray-600">Students Processed</p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {uploadResults.totalRows}
                                </div>
                                <p className="text-sm text-gray-600">Total Rows</p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                  {uploadResults.errors?.length || 0}
                                </div>
                                <p className="text-sm text-gray-600">Errors</p>
                              </div>
                            </div>
                            
                            {uploadResults.errors && uploadResults.errors.length > 0 && (
                              <div>
                                <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                                <div className="max-h-32 overflow-y-auto bg-red-50 rounded p-3">
                                  {uploadResults.errors.map((error: string, index: number) => (
                                    <div key={index} className="text-sm text-red-700">
                                      {error}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}