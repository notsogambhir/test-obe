'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  User, 
  Target, 
  TrendingUp,
  TrendingDown,
  Calculator,
  RefreshCw,
  Download,
  Eye,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAuthHeaders } from '@/lib/api-config';

interface StudentCOAttainment {
  studentId: string;
  studentName: string;
  studentRollNo?: string;
  sectionName?: string;
  coId: string;
  coCode: string;
  percentage: number;
  weightedPercentage: number; // Added weighted percentage
  metTarget: boolean;
  totalObtainedMarks: number;
  totalMaxMarks: number;
  attemptedQuestions: number;
  totalQuestions: number;
  assessmentWeightages?: { // Added assessment weightage breakdown
    assessmentId: string;
    assessmentName: string;
    assessmentType: string;
    weightage: number;
    obtainedMarks: number;
    maxMarks: number;
    percentage: number;
    contribution: number; // How much this assessment contributes to final weighted score
    totalWeightageForCO: number; // Total weightage for this CO
  }[];
}

interface CourseCOAttainment {
  coId: string;
  coCode: string;
  coDescription: string;
  totalStudents: number;
  studentsMeetingTarget: number;
  percentageMeetingTarget: number;
  attainmentLevel: 0 | 1 | 2 | 3;
  averageAttainment: number;
  studentAttainments: StudentCOAttainment[];
}

interface StudentReportsTabProps {
  courseId: string;
  courseData?: any;
  user?: any;
}

export function StudentReportsTab({ courseId, courseData, user }: StudentReportsTabProps) {
  const [attainments, setAttainments] = useState<CourseCOAttainment[]>([]);
  const [cos, setCOs] = useState<any[]>([]);
  const [selectedCO, setSelectedCO] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [lastCalculated, setLastCalculated] = useState<string>('');
  const [sections, setSections] = useState<{id: string, name: string, studentCount: number}[]>([]);

  useEffect(() => {
    console.log(`🔄 Student Reports tab: Course changed to: ${courseId}`);
    fetchCOs();
    fetchAttainments();
    fetchSections();
  }, [courseId]);

  // Refetch attainments when section changes
  useEffect(() => {
    if (courseId && selectedSection) {
      console.log(`🔄 Section changed to: ${selectedSection}, refetching attainments`);
      fetchAttainments();
    }
  }, [selectedSection, courseId]);

  const fetchCOs = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/cos`, { 
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCOs(data);
        console.log(`📊 Fetched ${data.length} COs for course ${courseId}`);
        
        // Set default selected CO if available and none currently selected
        if (data.length > 0 && !selectedCO) {
          setSelectedCO(data[0].id);
        }
      } else {
        console.error('Failed to fetch COs');
        setCOs([]);
      }
    } catch (error) {
      console.error('Error fetching COs:', error);
      setCOs([]);
    }
  };

  const fetchAttainments = async () => {
    try {
      setLoading(true);
      
      // Build API URL with section parameter
      const apiUrl = selectedSection && selectedSection !== 'all' 
        ? `/api/courses/${courseId}/compliant-co-attainment?sectionId=${selectedSection}`
        : `/api/courses/${courseId}/compliant-co-attainment`;
      
      const response = await fetch(apiUrl, { 
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch attainments: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📊 CO Attainment API Response:', data);
      
      if (data && data.coAttainments) {
        setAttainments(data.coAttainments);
        setLastCalculated(new Date(data.calculatedAt).toLocaleString());
        
        // Set default selected CO if available
        if (data.coAttainments.length > 0 && !selectedCO) {
          setSelectedCO(data.coAttainments[0].coId);
        }
      } else {
        // Handle case where no COs exist
        console.log('ℹ️ No CO attainments found - course may not have COs defined');
        setAttainments([]);
        setLastCalculated('');
      }
    } catch (error) {
      console.error('Failed to fetch attainments:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch student CO attainment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      console.log(`📋 Fetching sections for course: ${courseId}`);
      
      const response = await fetch(`/api/courses/${courseId}/sections`, { 
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data: any[] = await response.json();
        console.log('📋 Sections data received:', data);
        setSections(data);
      } else {
        console.error('Failed to fetch sections data');
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  const getAttainmentLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 3: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getAttainmentLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Level 1';
      case 2: return 'Level 2';
      case 3: return 'Level 3';
      default: return 'Not Attained';
    }
  };

  const getProgressColor = (percentage: number, target: number) => {
    if (percentage >= target) return 'bg-green-500';
    if (percentage >= target * 0.8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const selectedCOData = attainments.find(co => co.coId === selectedCO);

  const filteredStudentAttainments = selectedCOData ? 
    (selectedSection === 'all' 
      ? selectedCOData.studentAttainments 
      : selectedCOData.studentAttainments.filter(student => student.sectionName === selectedSection)
    ) : [];

  const averageAttainment = filteredStudentAttainments.length > 0 
    ? filteredStudentAttainments.reduce((sum, s) => sum + s.percentage, 0) / filteredStudentAttainments.length 
    : 0;

  const studentsMeetingTarget = filteredStudentAttainments.filter(s => s.metTarget).length;

  const exportToCSV = () => {
    if (!selectedCOData) return;

    const headers = [
      'Student ID', 'Student Name', 'Section', 'CO Code', 'Simple Percentage', 'Weighted Percentage', 
      'Met Target', 'Obtained Marks', 'Max Marks', 'Attempted Questions', 'Total Questions'
    ];
    
    const rows = filteredStudentAttainments.map(student => [
      student.studentRollNo || '',
      student.studentName,
      student.sectionName || '',
      student.coCode,
      student.percentage.toFixed(2),
      student.weightedPercentage.toFixed(2),
      student.metTarget ? 'Yes' : 'No',
      student.totalObtainedMarks,
      student.totalMaxMarks,
      student.attemptedQuestions,
      student.totalQuestions
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-co-attainment-${selectedCOData.coCode}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Student CO attainment data exported to CSV",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Student CO Attainment Reports</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAttainments} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lastCalculated && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Last Calculated:</strong> {lastCalculated}
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Course Outcome</label>
              <Select value={selectedCO} onValueChange={setSelectedCO}>
                <SelectTrigger>
                  <SelectValue placeholder="Select CO" />
                </SelectTrigger>
                <SelectContent>
                  {cos.map((co) => (
                    <SelectItem key={co.id} value={co.id}>
                      {co.code} - {co.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name} ({section.studentCount} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCOData && (
            <>
              {/* CO Summary */}
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-1">{selectedCOData.coCode}</h4>
                    <p className="text-sm text-gray-600">{selectedCOData.coDescription}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {selectedCOData.percentageMeetingTarget.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Class Success Rate</div>
                  </div>
                  <div className="text-center">
                    <Badge className={getAttainmentLevelColor(selectedCOData.attainmentLevel)}>
                      {getAttainmentLevelLabel(selectedCOData.attainmentLevel)}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {selectedCOData.averageAttainment.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Average Attainment</div>
                  </div>
                </div>
              </div>

              {/* Student Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-3">
                  <CardHeader className="pb-2 px-0 pt-0">
                    <CardTitle className="text-xs font-medium">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="text-xl font-bold">{filteredStudentAttainments.length}</div>
                  </CardContent>
                </Card>

                <Card className="p-3">
                  <CardHeader className="pb-2 px-0 pt-0">
                    <CardTitle className="text-xs font-medium">Target Met</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="text-xl font-bold">{studentsMeetingTarget}</div>
                  </CardContent>
                </Card>

                <Card className="p-3">
                  <CardHeader className="pb-2 px-0 pt-0">
                    <CardTitle className="text-xs font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="text-xl font-bold">
                      {filteredStudentAttainments.length > 0 
                        ? ((studentsMeetingTarget / filteredStudentAttainments.length) * 100).toFixed(1) 
                        : '0'}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-3">
                  <CardHeader className="pb-2 px-0 pt-0">
                    <CardTitle className="text-xs font-medium">Average Score</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="text-xl font-bold">{averageAttainment.toFixed(1)}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Button */}
              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </div>

              {/* Student Details Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Student Attainment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Section</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Weighted CO Score</TableHead>
                          <TableHead>Target Met</TableHead>
                          <TableHead>Questions Attempted</TableHead>
                          <TableHead>Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudentAttainments.map((student) => (
                          <TableRow key={student.studentId}>
                            <TableCell className="font-medium">{student.studentRollNo || '-'}</TableCell>
                            <TableCell>{student.studentName}</TableCell>
                            <TableCell>{student.sectionName || '-'}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="font-medium">{student.totalObtainedMarks || 0}</span>
                                <span className="text-gray-500">/{student.totalMaxMarks || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{student.weightedPercentage.toFixed(1)}%</span>
                                {student.metTarget ? (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              {student.assessmentWeightages && student.assessmentWeightages.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Weighted avg of {student.assessmentWeightages.length} assessments
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={student.metTarget ? "default" : "destructive"}>
                                {student.metTarget ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {student.attemptedQuestions}/{student.totalQuestions}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={student.percentage} 
                                  className="flex-1 h-2"
                                />
                                <span className="text-sm text-gray-600 min-w-12">
                                  {student.totalObtainedMarks}/{student.totalMaxMarks}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!selectedCO && cos.length === 0 && (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Course Outcomes Defined</h3>
              <p className="text-gray-500 mb-4">
                This course doesn't have any Course Outcomes (COs) defined yet.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                CO attainment calculations require Course Outcomes to be defined first.
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = `/courses/${courseId}/manage?tab=cos`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Define Course Outcomes
                </Button>
                <Button onClick={fetchAttainments} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          )}

          {selectedCO && cos.length > 0 && !selectedCOData && (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Student Data Available</h3>
              <p className="text-gray-500 mb-4">
                No student attainment data found for the selected Course Outcome.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Student CO attainment data will appear once marks are uploaded for assessments containing this CO.
              </p>
              <Button onClick={fetchAttainments} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}