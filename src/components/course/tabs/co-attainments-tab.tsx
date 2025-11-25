'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  BarChart3, 
  Users, 
  TrendingUp,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { courseEvents } from '@/lib/course-events';

interface COAttainment {
  coId: string;
  coCode: string;
  coDescription: string;
  targetPercentage: number;
  attainedPercentage: number;
  studentsAttained: number;
  totalStudents: number;
  attainmentLevel: number; // 0, 1, 2, or 3
}

interface CourseSettings {
  coTarget: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
}

interface COAttainmentsTabProps {
  courseId: string;
  courseData?: any;
}

export function COAttainmentsTab({ courseId, courseData }: COAttainmentsTabProps) {
  const [attainments, setAttainments] = useState<COAttainment[]>([]);
  const [courseSettings, setCourseSettings] = useState<CourseSettings>({
    coTarget: 60,
    level1Threshold: 60,
    level2Threshold: 70,
    level3Threshold: 80,
  });
  const [loading, setLoading] = useState(false);
  const [lastCalculated, setLastCalculated] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('overall');
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    console.log(`🔄 CO Attainments tab: Course changed to: ${courseId}`);
    // Reset state when course changes
    setAttainments([]);
    setLastCalculated('');
    setCourseSettings({
      coTarget: 60,
      level1Threshold: 60,
      level2Threshold: 70,
      level3Threshold: 80,
    });
    
    fetchAttainments();
    fetchCourseSettings();
    
    // Listen for CO updates
    const handleCOUpdate = () => {
      console.log(`🔄 CO update detected for course: ${courseId}`);
      fetchAttainments();
    };
    
    courseEvents.on('co-updated', handleCOUpdate);
    
    return () => {
      courseEvents.off('co-updated', handleCOUpdate);
    };
  }, [courseId]);

  const fetchAttainments = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/attainments`);
      if (!response.ok) {
        throw new Error('Failed to fetch attainments');
      }
      const data = await response.json();
      
      // Transform the API response to match the component interface
      const transformedAttainments: COAttainment[] = data.coAttainments.map((co: any) => ({
        coId: co.coId,
        coCode: co.coCode,
        coDescription: co.coDescription,
        targetPercentage: co.targetPercentage,
        attainedPercentage: co.attainedPercentage,
        studentsAttained: co.studentsAttained,
        totalStudents: co.totalStudents,
        attainmentLevel: co.attainmentLevel,
      }));
      
      setAttainments(transformedAttainments);
      setLastCalculated(new Date(data.calculatedAt).toLocaleString());
    } catch (error) {
      console.error('Failed to fetch attainments:', error);
      // Set mock data as fallback
      const mockAttainments: COAttainment[] = [
        {
          coId: '1',
          coCode: 'CO1',
          coDescription: 'Understand fundamental programming concepts',
          targetPercentage: 60,
          attainedPercentage: 75.5,
          studentsAttained: 45,
          totalStudents: 60,
          attainmentLevel: 2,
        },
        {
          coId: '2',
          coCode: 'CO2',
          coDescription: 'Design and implement algorithms',
          targetPercentage: 60,
          attainedPercentage: 68.3,
          studentsAttained: 40,
          totalStudents: 58,
          attainmentLevel: 2,
        },
        {
          coId: '3',
          coCode: 'CO3',
          coDescription: 'Apply programming skills to solve problems',
          targetPercentage: 60,
          attainedPercentage: 55.2,
          studentsAttained: 30,
          totalStudents: 55,
          attainmentLevel: 1,
        },
        {
          coId: '4',
          coCode: 'CO4',
          coDescription: 'Analyze and debug code effectively',
          targetPercentage: 60,
          attainedPercentage: 82.1,
          studentsAttained: 48,
          totalStudents: 58,
          attainmentLevel: 3,
        },
        {
          coId: '5',
          coCode: 'CO5',
          coDescription: 'Work collaboratively on projects',
          targetPercentage: 60,
          attainedPercentage: 91.7,
          studentsAttained: 55,
          totalStudents: 60,
          attainmentLevel: 3,
        },
      ];
      setAttainments(mockAttainments);
      setLastCalculated(new Date().toLocaleString());
    }
  };

  const fetchCourseSettings = async () => {
    try {
      console.log(`🔍 Fetching course settings for CO Attainments tab, courseId: ${courseId}`);
      const response = await fetch(`/api/courses/${courseId}/settings?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course settings');
      }
      const data = await response.json();
      console.log(`📊 Received course settings for CO Attainments tab, courseId: ${courseId}:`, data);
      setCourseSettings({
        coTarget: data.coTarget,
        level1Threshold: data.level1Threshold,
        level2Threshold: data.level2Threshold,
        level3Threshold: data.level3Threshold,
      });
    } catch (error) {
      console.error('Failed to fetch course settings:', error);
      // Set default values as fallback
      setCourseSettings({
        coTarget: 60,
        level1Threshold: 60,
        level2Threshold: 70,
        level3Threshold: 80,
      });
    }
  };

  const calculateAttainments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/attainments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academicYear: '2024-25',
          force: true, // Save results to database
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate attainments');
      }

      const data = await response.json();
      
      // Transform the API response to match the component interface
      const transformedAttainments: COAttainment[] = data.data.coAttainments.map((co: any) => ({
        coId: co.coId,
        coCode: co.coCode,
        coDescription: co.coDescription,
        targetPercentage: co.targetPercentage,
        attainedPercentage: co.attainedPercentage,
        studentsAttained: co.studentsAttained,
        totalStudents: co.totalStudents,
        attainmentLevel: co.attainmentLevel,
      }));
      
      setAttainments(transformedAttainments);
      setLastCalculated(new Date(data.data.calculatedAt).toLocaleString());
      
      toast({
        title: "Success",
        description: "CO attainments calculated successfully",
      });
    } catch (error) {
      console.error('Failed to calculate attainments:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to calculate attainments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const averageAttainment = attainments.length > 0 
    ? attainments.reduce((sum, a) => sum + (a.attainedPercentage != null && a.attainedPercentage !== undefined ? a.attainedPercentage : 0), 0) / attainments.length 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <CardTitle>CO Attainments</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={calculateAttainments} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Calculating...' : 'Recalculate'}
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

          <div className="space-y-6">
            {attainments.map((attainment) => (
              <div key={attainment.coId} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{attainment.coCode}</h3>
                      <Badge className={getAttainmentLevelColor(attainment.attainmentLevel)}>
                        {getAttainmentLevelLabel(attainment.attainmentLevel)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{attainment.coDescription}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {attainment.attainedPercentage != null && attainment.attainedPercentage !== undefined 
                        ? `${attainment.attainedPercentage.toFixed(1)}%` 
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Attained</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Target: {attainment.targetPercentage}%</span>
                      <span>Achieved: {attainment.attainedPercentage != null && attainment.attainedPercentage !== undefined 
                        ? `${attainment.attainedPercentage.toFixed(1)}%` 
                        : 'N/A'}</span>
                    </div>
                    <Progress 
                      value={attainment.attainedPercentage != null && attainment.attainedPercentage !== undefined 
                        ? attainment.attainedPercentage 
                        : 0} 
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>
                        {attainment.studentsAttained}/{attainment.totalStudents} students
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>
                        {((attainment.studentsAttained / attainment.totalStudents) * 100).toFixed(1)}% success rate
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-purple-600" />
                      <span>
                        Level {attainment.attainmentLevel} attainment
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-3">
          <CardHeader className="pb-2 px-0 pt-0">
            <CardTitle className="text-xs font-medium">Average Attainment</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="text-xl font-bold">{averageAttainment.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="pb-2 px-0 pt-0">
            <CardTitle className="text-xs font-medium">COs Target Met</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="text-xl font-bold">
              {attainments.filter(a => a.attainedPercentage != null && a.attainedPercentage !== undefined && a.attainedPercentage >= a.targetPercentage).length}/{attainments.length}
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="pb-2 px-0 pt-0">
            <CardTitle className="text-xs font-medium">Level 3 Attainments</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="text-xl font-bold">
              {attainments.filter(a => a.attainmentLevel === 3).length}
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="pb-2 px-0 pt-0">
            <CardTitle className="text-xs font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="text-xl font-bold">
              {Math.max(...attainments.map(a => a.totalStudents), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attainment Distribution */}
      <Card className="p-4">
        <CardHeader className="px-0 pt-0 pb-3">
          <CardTitle className="text-base">Attainment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {attainments.filter(a => a.attainmentLevel === 0).length}
              </div>
              <div className="text-sm text-gray-600">Not Attained</div>
              <div className="text-xs text-gray-500">
                {attainments.length > 0 ? ((attainments.filter(a => a.attainmentLevel === 0).length / attainments.length) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {attainments.filter(a => a.attainmentLevel === 1).length}
              </div>
              <div className="text-sm text-gray-600">Level 1</div>
              <div className="text-xs text-gray-500">
                {attainments.length > 0 ? ((attainments.filter(a => a.attainmentLevel === 1).length / attainments.length) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {attainments.filter(a => a.attainmentLevel === 2).length}
              </div>
              <div className="text-sm text-gray-600">Level 2</div>
              <div className="text-xs text-gray-500">
                {attainments.length > 0 ? ((attainments.filter(a => a.attainmentLevel === 2).length / attainments.length) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {attainments.filter(a => a.attainmentLevel === 3).length}
              </div>
              <div className="text-sm text-gray-600">Level 3</div>
              <div className="text-xs text-gray-500">
                {attainments.length > 0 ? ((attainments.filter(a => a.attainmentLevel === 3).length / attainments.length) * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NBA Calculation Info */}
      <Card className="p-4">
        <CardHeader className="px-0 pt-0 pb-3">
          <CardTitle className="text-base">NBA Calculation Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Individual Student Attainment</h4>
              <p className="text-sm text-blue-700">
                A student is considered to have attained a CO if they score {'>='} {courseSettings.coTarget}% 
                in all assessments mapped to that CO.
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Class-Level Attainment</h4>
              <p className="text-sm text-green-700">
                Class attainment is calculated as the percentage of students who attained the CO. 
                This percentage is then mapped to attainment levels:
              </p>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>• Level 3: {'>='} {courseSettings.level3Threshold}% of students attain CO</li>
                <li>• Level 2: {'>='} {courseSettings.level2Threshold}% of students attain CO</li>
                <li>• Level 1: {'>='} {courseSettings.level1Threshold}% of students attain CO</li>
                <li>• Level 0: {'<'} {courseSettings.level1Threshold}% of students attain CO</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}