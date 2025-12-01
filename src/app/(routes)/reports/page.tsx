'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Target,
  Download,
  Filter,
  Loader2
} from 'lucide-react';
import { COAttainmentReport } from '@/components/reports/co-attainment-report';
import { POAttainmentReport } from '@/components/reports/po-attainment-report';

interface Course {
  id: string;
  code: string;
  name: string;
  batchId: string;
}

interface ReportData {
  courses: Course[];
  loading: boolean;
  error: string | null;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { selectedCollege, selectedProgram, selectedBatch } = useSidebarContext();
  
  const [reportData, setReportData] = useState<ReportData>({
    courses: [],
    loading: false,
    error: null
  });
  
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [activeTab, setActiveTab] = useState('co-attainment');

  // Fetch courses when filters change
  useEffect(() => {
    if (selectedBatch) {
      fetchCourses();
    }
  }, [selectedBatch]);

  const fetchCourses = async () => {
    if (!selectedBatch) return;
    
    setReportData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`/api/courses/batch?batchId=${selectedBatch}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const courses = await response.json();
      setReportData({
        courses,
        loading: false,
        error: null
      });
    } catch (error) {
      setReportData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch courses'
      }));
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive CO and PO attainment reports with detailed analysis
          </p>
        </div>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Reports
        </Button>
      </div>

      {/* Active Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Active Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedCollege && (
              <Badge variant="secondary">
                College: {selectedCollege}
              </Badge>
            )}
            {selectedProgram && (
              <Badge variant="secondary">
                Program: {selectedProgram}
              </Badge>
            )}
            {selectedBatch && (
              <Badge variant="secondary">
                Batch: {selectedBatch}
              </Badge>
            )}
            {selectedCourse && (
              <Badge variant="secondary">
                Course: {reportData.courses.find(c => c.id === selectedCourse)?.code}
              </Badge>
            )}
          </div>
          
          {!selectedBatch && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please select a batch from the sidebar to view reports.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Selection (for CO reports) */}
      {selectedBatch && reportData.courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="course-select">Select Course</Label>
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                  disabled={reportData.loading}
                >
                  <SelectTrigger id="course-select">
                    <SelectValue placeholder="Select a course for CO reports" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportData.courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="co-attainment" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            CO Attainment Reports
          </TabsTrigger>
          <TabsTrigger value="po-attainment" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            PO Attainment Reports
          </TabsTrigger>
        </TabsList>

        {/* CO Attainment Reports */}
        <TabsContent value="co-attainment">
          {selectedCourse ? (
            <COAttainmentReport 
              courseId={selectedCourse}
              batchId={selectedBatch || ''}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Select a course to view CO attainment reports
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PO Attainment Reports */}
        <TabsContent value="po-attainment">
          <POAttainmentReport 
            batchId={selectedBatch || undefined}
            programId={selectedProgram || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}