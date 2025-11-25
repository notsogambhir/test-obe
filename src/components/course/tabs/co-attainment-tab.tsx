'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, TrendingUp, Users, Calculator, RefreshCw, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface COAttainmentResult {
  coId: string;
  coCode: string;
  coDescription: string;
  studentCount: number;
  studentsMeetingTarget: number;
  percentageMeetingTarget: number;
  attainmentLevel: 0 | 1 | 2 | 3;
  targetPercentage: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
}

interface StudentCOAttainment {
  studentId: string;
  studentName: string;
  coId: string;
  coCode: string;
  percentage: number;
  metTarget: boolean;
}

interface COAttainmentSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
  academicYear?: string;
  semester?: string;
  totalStudents: number;
  overallAttainment: {
    level0Count: number;
    level1Count: number;
    level2Count: number;
    level3Count: number;
  };
  coAttainments: COAttainmentResult[];
  studentAttainments: StudentCOAttainment[];
}

interface COAttainmentTabProps {
  courseId: string;
  courseData?: any;
}

export function COAttainmentTab({ courseId, courseData }: COAttainmentTabProps) {
  const [attainmentData, setAttainmentData] = useState<COAttainmentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<string>('2024-2025');
  const [semester, setSemester] = useState<string>('1');

  const attainmentColors = {
    0: 'bg-gray-100 text-gray-800',
    1: 'bg-yellow-100 text-yellow-800',
    2: 'bg-orange-100 text-orange-800',
    3: 'bg-green-100 text-green-800'
  };

  const chartColors = {
    0: '#9CA3AF',
    1: '#FCD34D',
    2: '#FB923C',
    3: '#34D399'
  };

  useEffect(() => {
    if (courseId) {
      fetchAttainmentData();
    }
  }, [courseId, academicYear, semester]);

  const fetchAttainmentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        ...(academicYear && { academicYear }),
        ...(semester && { semester })
      });

      const response = await fetch(`/api/courses/${courseId}/co-attainment?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch CO attainment data');
      }

      const data = await response.json();
      setAttainmentData(data);
    } catch (error) {
      console.error('Error fetching CO attainment data:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load CO attainment data";
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAttainment = async () => {
    setCalculating(true);
    
    try {
      const response = await fetch(`/api/courses/${courseId}/co-attainment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academicYear,
          semester
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate CO attainment');
      }

      const result = await response.json();
      setAttainmentData(result.data);
      
      toast({
        title: "Success",
        description: "CO attainment calculated and saved successfully",
      });
    } catch (error) {
      console.error('Error calculating CO attainment:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to calculate CO attainment";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const getAttainmentLevelLabel = (level: number) => {
    switch (level) {
      case 0: return 'Not Attained';
      case 1: return 'Level 1';
      case 2: return 'Level 2';
      case 3: return 'Level 3';
      default: return 'Unknown';
    }
  };

  const getOverallAttainmentData = () => {
    if (!attainmentData) return [];
    
    const { overallAttainment } = attainmentData;
    return [
      { name: 'Not Attained', value: overallAttainment.level0Count, color: chartColors[0] },
      { name: 'Level 1', value: overallAttainment.level1Count, color: chartColors[1] },
      { name: 'Level 2', value: overallAttainment.level2Count, color: chartColors[2] },
      { name: 'Level 3', value: overallAttainment.level3Count, color: chartColors[3] }
    ];
  };

  const getCOAttainmentChartData = () => {
    if (!attainmentData) return [];
    
    return attainmentData.coAttainments.map(co => ({
      name: co.coCode,
      percentage: co.percentageMeetingTarget,
      level: co.attainmentLevel
    }));
  };

  if (loading && !attainmentData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-600">Loading CO attainment data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-red-600">
            <Target className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Failed to Load Data</h3>
          <p className="text-sm text-gray-600 max-w-md">{error}</p>
        </div>
        <Button
          onClick={fetchAttainmentData}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!attainmentData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Target className="h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">No CO Attainment Data</h3>
        <p className="text-sm text-gray-600 text-center max-w-md">
          Calculate CO attainment to see detailed analysis of course outcome performance.
        </p>
        <Button
          onClick={handleCalculateAttainment}
          disabled={calculating}
          className="flex items-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          {calculating ? 'Calculating...' : 'Calculate CO Attainment'}
        </Button>
      </div>
    );
  }

  const overallData = getOverallAttainmentData();
  const coChartData = getCOAttainmentChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">CO Attainment Analysis</h3>
          <p className="text-sm text-gray-600">
            Analyze course outcome attainment levels and student performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-2025">2024-2025</SelectItem>
              <SelectItem value="2023-2024">2023-2024</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Sem 1</SelectItem>
              <SelectItem value="2">Sem 2</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={fetchAttainmentData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={handleCalculateAttainment}
            disabled={calculating}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            {calculating ? 'Calculating...' : 'Calculate'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{attainmentData.totalStudents}</div>
            <p className="text-xs text-gray-600">Total Students</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{overallData[3]?.value || 0}</div>
            <p className="text-xs text-gray-600">Level 3 COs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{overallData[2]?.value || 0}</div>
            <p className="text-xs text-gray-600">Level 2 COs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{overallData[1]?.value || 0}</div>
            <p className="text-xs text-gray-600">Level 1 COs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="co-details">CO Details</TabsTrigger>
          <TabsTrigger value="students">Student Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Attainment Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Overall Attainment Distribution
                </CardTitle>
                <CardDescription>
                  Distribution of CO attainment levels across all course outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={overallData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {overallData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* CO Attainment Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  CO Attainment Percentages
                </CardTitle>
                <CardDescription>
                  Percentage of students meeting target for each CO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={coChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="co-details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CO Attainment Details</CardTitle>
              <CardDescription>
                Detailed breakdown of attainment levels for each course outcome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CO Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Students Meeting Target</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Attainment Level</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attainmentData.coAttainments.map((co) => (
                    <TableRow key={co.coId}>
                      <TableCell className="font-medium">{co.coCode}</TableCell>
                      <TableCell className="max-w-xs truncate">{co.coDescription}</TableCell>
                      <TableCell>
                        {co.studentsMeetingTarget}/{co.studentCount}
                      </TableCell>
                      <TableCell>{co.percentageMeetingTarget.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge className={attainmentColors[co.attainmentLevel]}>
                          {getAttainmentLevelLabel(co.attainmentLevel)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={co.percentageMeetingTarget} className="w-16" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Performance
              </CardTitle>
              <CardDescription>
                Individual student attainment for each course outcome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      {attainmentData.coAttainments.map((co) => (
                        <TableHead key={co.coId} className="text-center">
                          {co.coCode}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(new Set(attainmentData.studentAttainments.map(s => s.studentName))).map((studentName) => {
                      const studentData = attainmentData.studentAttainments.filter(s => s.studentName === studentName);
                      
                      return (
                        <TableRow key={studentName}>
                          <TableCell className="font-medium">{studentName}</TableCell>
                          {attainmentData.coAttainments.map((co) => {
                            const studentCO = studentData.find(s => s.coId === co.coId);
                            
                            return (
                              <TableCell key={co.coId} className="text-center">
                                {studentCO ? (
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium">
                                      {studentCO.percentage.toFixed(1)}%
                                    </div>
                                    <Badge 
                                      variant={studentCO.metTarget ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {studentCO.metTarget ? "Met" : "Not Met"}
                                    </Badge>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}