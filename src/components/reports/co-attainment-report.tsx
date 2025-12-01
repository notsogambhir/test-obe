'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface COAttainmentReportProps {
  courseId: string;
  batchId: string;
}

interface COData {
  id: string;
  code: string;
  description: string;
  overallAttainment: number;
  targetPercentage: number;
  metTarget: boolean;
  studentsCount: number;
  assessments: AssessmentData[];
}

interface AssessmentData {
  id: string;
  name: string;
  type: string;
  maxMarks: number;
  weightage: number;
  averageAttainment: number;
  sectionWiseAttainment: SectionWiseData[];
}

interface SectionWiseData {
  sectionName: string;
  studentCount: number;
  averageAttainment: number;
  students: StudentAttainment[];
}

interface StudentAttainment {
  studentId: string;
  studentName: string;
  studentEmail: string;
  attainment: number;
  metTarget: boolean;
}

interface CourseData {
  id: string;
  code: string;
  name: string;
  overallAttainment: number;
  targetPercentage: number;
  cos: COData[];
  sections: string[];
}

export function COAttainmentReport({ courseId, batchId }: COAttainmentReportProps) {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCOAttainmentData();
  }, [courseId, batchId]);

  const fetchCOAttainmentData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/co-attainment?courseId=${courseId}&batchId=${batchId}`);
      if (!response.ok) throw new Error('Failed to fetch CO attainment data');
      
      const data = await response.json();
      setCourseData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch CO attainment data');
    } finally {
      setLoading(false);
    }
  };

  const getAttainmentColor = (percentage: number, target: number) => {
    if (percentage >= target) return 'text-green-600';
    if (percentage >= target * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttainmentBadge = (metTarget: boolean) => {
    return metTarget ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Target Met
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Target Not Met
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading CO attainment data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchCOAttainmentData} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!courseData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No CO attainment data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{courseData.code} - {courseData.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Overall Attainment:</span>
              <span className={`text-2xl font-bold ${getAttainmentColor(courseData.overallAttainment, courseData.targetPercentage)}`}>
                {courseData.overallAttainment.toFixed(1)}%
              </span>
              {getAttainmentBadge(courseData.overallAttainment >= courseData.targetPercentage)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{courseData.cos.length}</div>
              <div className="text-sm text-gray-600">Course Outcomes</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{courseData.sections.length}</div>
              <div className="text-sm text-gray-600">Sections</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{courseData.targetPercentage}%</div>
              <div className="text-sm text-gray-600">Target Percentage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overall CO Attainment</TabsTrigger>
          <TabsTrigger value="assessment-wise">Assessment Wise</TabsTrigger>
          <TabsTrigger value="section-wise">Section Wise</TabsTrigger>
        </TabsList>

        {/* Overall CO Attainment */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Course Outcome Overall Attainment</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CO Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Target %</TableHead>
                    <TableHead>Achieved %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseData.cos.map((co) => (
                    <TableRow key={co.id}>
                      <TableCell className="font-medium">{co.code}</TableCell>
                      <TableCell className="max-w-xs truncate">{co.description}</TableCell>
                      <TableCell>{co.targetPercentage}%</TableCell>
                      <TableCell className={`font-medium ${getAttainmentColor(co.overallAttainment, co.targetPercentage)}`}>
                        {co.overallAttainment.toFixed(1)}%
                      </TableCell>
                      <TableCell>{getAttainmentBadge(co.metTarget)}</TableCell>
                      <TableCell>
                        <Progress 
                          value={co.overallAttainment} 
                          className="w-full"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment Wise Attainment */}
        <TabsContent value="assessment-wise">
          <div className="space-y-6">
            {courseData.cos.map((co) => (
              <Card key={co.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{co.code} - Assessment Wise Attainment</span>
                    <Badge variant={co.metTarget ? "default" : "destructive"}>
                      Overall: {co.overallAttainment.toFixed(1)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assessment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Weightage</TableHead>
                        <TableHead>Average Attainment</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {co.assessments.map((assessment) => (
                        <TableRow key={assessment.id}>
                          <TableCell className="font-medium">{assessment.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{assessment.type}</Badge>
                          </TableCell>
                          <TableCell>{assessment.weightage}%</TableCell>
                          <TableCell className={`font-medium ${getAttainmentColor(assessment.averageAttainment, courseData.targetPercentage)}`}>
                            {assessment.averageAttainment.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <Progress 
                              value={assessment.averageAttainment} 
                              className="w-full"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Section Wise Attainment */}
        <TabsContent value="section-wise">
          <div className="space-y-6">
            {courseData.cos.map((co) => (
              <Card key={co.id}>
                <CardHeader>
                  <CardTitle>{co.code} - Section Wise Attainment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {co.assessments.map((assessment) => (
                      <div key={assessment.id}>
                        <h4 className="font-medium mb-3">{assessment.name}</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {assessment.sectionWiseAttainment.map((section) => (
                            <Card key={section.sectionName} className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium">Section {section.sectionName}</h5>
                                <Badge variant="outline">
                                  {section.studentCount} students
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Average Attainment:</span>
                                  <span className={`font-medium ${getAttainmentColor(section.averageAttainment, courseData.targetPercentage)}`}>
                                    {section.averageAttainment.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress value={section.averageAttainment} className="w-full" />
                              </div>
                              
                              {/* Student-wise details */}
                              <div className="mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    // Toggle student details visibility
                                    const element = document.getElementById(`students-${co.id}-${assessment.id}-${section.sectionName}`);
                                    element?.classList.toggle('hidden');
                                  }}
                                >
                                  View Student Details
                                </Button>
                                <div 
                                  id={`students-${co.id}-${assessment.id}-${section.sectionName}`}
                                  className="hidden mt-3 max-h-48 overflow-y-auto"
                                >
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs">Student</TableHead>
                                        <TableHead className="text-xs">Email</TableHead>
                                        <TableHead className="text-xs">Attainment</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {section.students.map((student) => (
                                        <TableRow key={student.studentId}>
                                          <TableCell className="text-xs">{student.studentName}</TableCell>
                                          <TableCell className="text-xs">{student.studentEmail}</TableCell>
                                          <TableCell className={`text-xs font-medium ${getAttainmentColor(student.attainment, courseData.targetPercentage)}`}>
                                            {student.attainment.toFixed(1)}%
                                          </TableCell>
                                          <TableCell className="text-xs">
                                            {getAttainmentBadge(student.metTarget)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}