'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Calculator, Settings, TrendingUp, Target, Users, BookOpen, Save, History } from 'lucide-react';
import { toast } from 'sonner';

interface POAttainment {
  poCode: string;
  directAttainment: number;
  indirectAttainment: number;
  finalAttainment: number;
  targetLevel?: number;
  courses: {
    courseId: string;
    courseCode: string;
    courseName: string;
    coContributions: {
      coCode: string;
      coAttainment: number;
      mappingLevel: number;
      contribution: number;
    }[];
    totalContribution: number;
  }[];
}

interface AttainmentSummary {
  totalPOs: number;
  averageDirectAttainment: number;
  averageFinalAttainment: number;
  targetMetCount: number;
}

interface AttainmentWeights {
  directWeight: number;
  indirectWeight: number;
}

interface POAttainmentData {
  batchId: string;
  programId: string;
  weights: AttainmentWeights;
  poAttainments: POAttainment[];
  summary: AttainmentSummary;
}

export function POAttainmentDashboard() {
  const [data, setData] = useState<POAttainmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [batches, setBatches] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [weights, setWeights] = useState<AttainmentWeights>({ directWeight: 0.8, indirectWeight: 0.2 });
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [showIndirectModal, setShowIndirectModal] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchBatches();
    fetchWeights();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (response.ok) {
        const programsData = await response.json();
        setPrograms(programsData);
      }
    } catch (error) {
      toast.error('Failed to fetch programs');
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const batchesData = await response.json();
        setBatches(batchesData);
      }
    } catch (error) {
      toast.error('Failed to fetch batches');
    }
  };

  const fetchWeights = async () => {
    try {
      const response = await fetch('/api/admin/attainment-weights');
      if (response.ok) {
        const weightsData = await response.json();
        setWeights(weightsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch weights');
    }
  };

  const calculatePOAttainment = async () => {
    if (!selectedBatch || !selectedProgram) {
      toast.error('Please select both program and batch');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/programs/${selectedProgram}/po-attainment?batchId=${selectedBatch}&programId=${selectedProgram}`
      );
      
      if (response.ok) {
        const attainmentData = await response.json();
        setData(attainmentData.data);
        toast.success('PO Attainment calculated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to calculate PO Attainment');
      }
    } catch (error) {
      toast.error('Failed to calculate PO Attainment');
    } finally {
      setLoading(false);
    }
  };

  const updateWeights = async () => {
    try {
      const response = await fetch('/api/admin/attainment-weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weights)
      });

      if (response.ok) {
        toast.success('Weights updated successfully');
        setShowWeightsModal(false);
        if (data) {
          calculatePOAttainment(); // Recalculate with new weights
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update weights');
      }
    } catch (error) {
      toast.error('Failed to update weights');
    }
  };

  const finalizeCalculation = async () => {
    if (!data) {
      toast.error('No calculation data to finalize');
      return;
    }

    try {
      const response = await fetch('/api/audit-trail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: data.batchId,
          programId: data.programId,
          calculationData: data
        })
      });

      if (response.ok) {
        toast.success('Calculation finalized and saved to audit trail');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to finalize calculation');
      }
    } catch (error) {
      toast.error('Failed to finalize calculation');
    }
  };

  const exportToExcel = () => {
    if (!data) return;
    
    // Create CSV content
    let csvContent = 'PO Code,Direct Attainment,Indirect Attainment,Final Attainment,Target Level,Status\n';
    
    data.poAttainments.forEach(po => {
      const status = po.finalAttainment >= (po.targetLevel || 2.0) ? 'Target Met' : 'Target Not Met';
      csvContent += `${po.poCode},${po.directAttainment},${po.indirectAttainment},${po.finalAttainment},${po.targetLevel || 2.0},${status}\n`;
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `po-attainment-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  const getAttainmentColor = (attainment: number, target: number = 2.0) => {
    if (attainment >= target) return 'text-green-600';
    if (attainment >= target * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttainmentBadgeVariant = (attainment: number, target: number = 2.0) => {
    if (attainment >= target) return 'default';
    if (attainment >= target * 0.8) return 'secondary';
    return 'destructive';
  };

  // Prepare chart data
  const chartData = data?.poAttainments.map(po => ({
    poCode: po.poCode,
    Direct: Math.round(po.directAttainment * 100) / 100,
    Indirect: Math.round(po.indirectAttainment * 100) / 100,
    Final: Math.round(po.finalAttainment * 100) / 100,
    Target: po.targetLevel || 2.0
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PO Attainment Analysis</h1>
          <p className="text-muted-foreground">
            Calculate and analyze Program Outcome attainment for accreditation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowWeightsModal(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure Weights
          </Button>
          <Button
            variant="outline"
            onClick={finalizeCalculation}
            disabled={!data}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Finalize Calculation
          </Button>
          <Button
            onClick={exportToExcel}
            disabled={!data}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Selection Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.program?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={calculatePOAttainment}
                disabled={loading || !selectedProgram || !selectedBatch}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                {loading ? 'Calculating...' : 'Calculate PO Attainment'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total POs</p>
                    <p className="text-2xl font-bold">{data.summary.totalPOs}</p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Direct Attainment</p>
                    <p className={`text-2xl font-bold ${getAttainmentColor(data.summary.averageDirectAttainment)}`}>
                      {Math.round(data.summary.averageDirectAttainment * 100) / 100}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Final Attainment</p>
                    <p className={`text-2xl font-bold ${getAttainmentColor(data.summary.averageFinalAttainment)}`}>
                      {Math.round(data.summary.averageFinalAttainment * 100) / 100}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Targets Met</p>
                    <p className="text-2xl font-bold text-green-600">
                      {data.summary.targetMetCount}/{data.summary.totalPOs}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
              <TabsTrigger value="course-contribution">Course Contributions</TabsTrigger>
              <TabsTrigger value="co-po-mappings">CO-PO Mappings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>PO Attainment Comparison</CardTitle>
                    <CardDescription>
                      Comparison of Direct, Indirect, and Final attainment levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="poCode" />
                        <YAxis domain={[0, 3]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Direct" fill="#8884d8" />
                        <Bar dataKey="Indirect" fill="#82ca9d" />
                        <Bar dataKey="Final" fill="#ffc658" />
                        <Bar dataKey="Target" fill="#ff7c7c" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Line Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Trend Analysis</CardTitle>
                    <CardDescription>
                      PO attainment trends across all outcomes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="poCode" />
                        <YAxis domain={[0, 3]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Final" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="Target" stroke="#ff7c7c" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>PO Attainment Details</CardTitle>
                  <CardDescription>
                    Detailed breakdown of attainment levels for each Program Outcome
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left">PO Code</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Direct</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Indirect</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Final</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Target</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.poAttainments.map((po, index) => (
                          <tr key={po.poCode} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 px-4 py-2 font-medium">{po.poCode}</td>
                            <td className={`border border-gray-300 px-4 py-2 text-center ${getAttainmentColor(po.directAttainment)}`}>
                              {Math.round(po.directAttainment * 100) / 100}
                            </td>
                            <td className={`border border-gray-300 px-4 py-2 text-center ${getAttainmentColor(po.indirectAttainment)}`}>
                              {Math.round(po.indirectAttainment * 100) / 100}
                            </td>
                            <td className={`border border-gray-300 px-4 py-2 text-center font-bold ${getAttainmentColor(po.finalAttainment)}`}>
                              {Math.round(po.finalAttainment * 100) / 100}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {po.targetLevel || 2.0}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <Badge variant={getAttainmentBadgeVariant(po.finalAttainment, po.targetLevel)}>
                                {po.finalAttainment >= (po.targetLevel || 2.0) ? 'Target Met' : 'Target Not Met'}
                              </Badge>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <Progress 
                                value={(po.finalAttainment / (po.targetLevel || 2.0)) * 100} 
                                className="w-full"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="course-contribution" className="space-y-4">
              {data.poAttainments.map((po) => (
                <Card key={po.poCode}>
                  <CardHeader>
                    <CardTitle>{po.poCode} - Course Contributions</CardTitle>
                    <CardDescription>
                      How each course contributes to {po.poCode} attainment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {po.courses.map((course) => (
                        <div key={course.courseId} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">{course.courseCode} - {course.courseName}</h4>
                            <Badge variant="outline">
                              Contribution: {Math.round(course.totalContribution * 100) / 100}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {course.coContributions.map((co) => (
                              <div key={co.coCode} className="text-sm p-2 bg-gray-50 rounded">
                                <span className="font-medium">{co.coCode}</span>
                                <div className="text-xs text-muted-foreground">
                                  Attainment: {Math.round(co.coAttainment * 100) / 100}, 
                                  Level: {co.mappingLevel}, 
                                  Contribution: {Math.round(co.contribution * 100) / 100}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="co-po-mappings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    CO-PO Mappings Overview
                  </CardTitle>
                  <CardDescription>
                    View and manage CO-PO mapping relationships for the selected program and batch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      CO-PO mappings are managed in the Course Management section. 
                      Please navigate to a specific course to view and edit CO-PO mappings.
                    </p>
                    <Button
                      onClick={() => window.open('/courses', '_blank')}
                      className="mt-4"
                    >
                      Go to Course Management
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Weights Configuration Modal */}
      {showWeightsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Configure Attainment Weights</CardTitle>
              <CardDescription>
                Set the weightage for Direct and Indirect attainment calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="directWeight">Direct Attainment Weight</Label>
                <Input
                  id="directWeight"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={weights.directWeight}
                  onChange={(e) => setWeights(prev => ({
                    ...prev,
                    directWeight: parseFloat(e.target.value)
                  }))}
                />
                <span className="text-sm text-muted-foreground">
                  {Math.round(weights.directWeight * 100)}%
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="indirectWeight">Indirect Attainment Weight</Label>
                <Input
                  id="indirectWeight"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={weights.indirectWeight}
                  onChange={(e) => setWeights(prev => ({
                    ...prev,
                    indirectWeight: parseFloat(e.target.value)
                  }))}
                />
                <span className="text-sm text-muted-foreground">
                  {Math.round(weights.indirectWeight * 100)}%
                </span>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowWeightsModal(false)}>
                  Cancel
                </Button>
                <Button onClick={updateWeights}>
                  Update Weights
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Filter({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}