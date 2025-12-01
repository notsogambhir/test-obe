'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

interface POAttainmentReportProps {
  batchId?: string;
  programId?: string;
}

interface POData {
  id: string;
  code: string;
  description: string;
  overallAttainment: number;
  targetPercentage: number;
  metTarget: boolean;
  coursesContribution: CourseContribution[];
}

interface CourseContribution {
  courseId: string;
  courseCode: string;
  courseName: string;
  contribution: number;
  attainment: number;
  weightage: number;
}

interface BatchData {
  id: string;
  name: string;
  programId: string;
  programName: string;
  overallAttainment: number;
  targetPercentage: number;
  pos: POData[];
}

interface ProgramData {
  id: string;
  name: string;
  code: string;
  overallAttainment: number;
  targetPercentage: number;
  batches: BatchData[];
  pos: POData[];
}

export function POAttainmentReport({ batchId, programId }: POAttainmentReportProps) {
  const [programData, setProgramData] = useState<ProgramData | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batchId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overall');

  useEffect(() => {
    fetchPOAttainmentData();
  }, [programId, batchId]);

  const fetchPOAttainmentData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (programId) params.append('programId', programId);
      if (batchId) params.append('batchId', batchId);
      
      const response = await fetch(`/api/reports/po-attainment?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch PO attainment data');
      
      const data = await response.json();
      setProgramData(data);
      if (batchId) {
        setSelectedBatchId(batchId);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch PO attainment data');
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
        <span className="ml-2">Loading PO attainment data...</span>
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
            <Button onClick={fetchPOAttainmentData} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!programData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No PO attainment data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedBatch = programData.batches.find(b => b.id === selectedBatchId);
  const currentBatchPOs = selectedBatch ? selectedBatch.pos : programData.pos;

  return (
    <div className="space-y-6">
      {/* Program Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <span>{programData.name} - {programData.code}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Overall PO Attainment:</span>
              <span className={`text-2xl font-bold ${getAttainmentColor(programData.overallAttainment, programData.targetPercentage)}`}>
                {programData.overallAttainment.toFixed(1)}%
              </span>
              {getAttainmentBadge(programData.overallAttainment >= programData.targetPercentage)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{programData.pos.length}</div>
              <div className="text-sm text-gray-600">Program Outcomes</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{programData.batches.length}</div>
              <div className="text-sm text-gray-600">Batches</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{programData.targetPercentage}%</div>
              <div className="text-sm text-gray-600">Target Percentage</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {programData.pos.filter(po => po.metTarget).length}
              </div>
              <div className="text-sm text-gray-600">POs Target Met</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Selection */}
      {programData.batches.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="batch-select">Select Batch</Label>
                <Select
                  value={selectedBatchId}
                  onValueChange={setSelectedBatchId}
                >
                  <SelectTrigger id="batch-select">
                    <SelectValue placeholder="Select batch for detailed view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Overall Program View</SelectItem>
                    {programData.batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">Overall PO Attainment</TabsTrigger>
          <TabsTrigger value="batch-wise">Batch Wise</TabsTrigger>
          <TabsTrigger value="course-contribution">Course Contribution</TabsTrigger>
        </TabsList>

        {/* Overall PO Attainment */}
        <TabsContent value="overall">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedBatch ? `${selectedBatch.name} - ` : 'Overall '}Program Outcome Attainment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Target %</TableHead>
                    <TableHead>Achieved %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBatchPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.code}</TableCell>
                      <TableCell className="max-w-xs truncate">{po.description}</TableCell>
                      <TableCell>{po.targetPercentage}%</TableCell>
                      <TableCell className={`font-medium ${getAttainmentColor(po.overallAttainment, po.targetPercentage)}`}>
                        {po.overallAttainment.toFixed(1)}%
                      </TableCell>
                      <TableCell>{getAttainmentBadge(po.metTarget)}</TableCell>
                      <TableCell>
                        <Progress 
                          value={po.overallAttainment} 
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

        {/* Batch Wise Comparison */}
        <TabsContent value="batch-wise">
          <div className="space-y-6">
            {programData.batches.map((batch) => (
              <Card key={batch.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{batch.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Overall:</span>
                      <span className={`text-lg font-bold ${getAttainmentColor(batch.overallAttainment, batch.targetPercentage)}`}>
                        {batch.overallAttainment.toFixed(1)}%
                      </span>
                      {getAttainmentBadge(batch.overallAttainment >= batch.targetPercentage)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batch.pos.map((po) => (
                      <Card key={po.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{po.code}</h5>
                          {getAttainmentBadge(po.metTarget)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Attainment:</span>
                            <span className={`font-medium ${getAttainmentColor(po.overallAttainment, po.targetPercentage)}`}>
                              {po.overallAttainment.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={po.overallAttainment} className="w-full" />
                          <p className="text-xs text-gray-600 truncate">{po.description}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Course Contribution */}
        <TabsContent value="course-contribution">
          <div className="space-y-6">
            {currentBatchPOs.map((po) => (
              <Card key={po.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{po.code} - Course Contribution Analysis</span>
                    <Badge variant={po.metTarget ? "default" : "destructive"}>
                      Overall: {po.overallAttainment.toFixed(1)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Course Name</TableHead>
                        <TableHead>Contribution</TableHead>
                        <TableHead>Attainment</TableHead>
                        <TableHead>Weightage</TableHead>
                        <TableHead>Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.coursesContribution.map((course) => (
                        <TableRow key={course.courseId}>
                          <TableCell className="font-medium">{course.courseCode}</TableCell>
                          <TableCell className="max-w-xs truncate">{course.courseName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {course.contribution.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-medium ${getAttainmentColor(course.attainment, programData.targetPercentage)}`}>
                            {course.attainment.toFixed(1)}%
                          </TableCell>
                          <TableCell>{course.weightage}%</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(course.contribution * course.attainment) / 100} 
                                className="w-16" 
                              />
                              <span className="text-sm text-gray-600">
                                {((course.contribution * course.attainment) / 100).toFixed(1)}%
                              </span>
                            </div>
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
      </Tabs>
    </div>
  );
}