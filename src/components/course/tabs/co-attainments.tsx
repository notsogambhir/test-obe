'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Target, TrendingUp, Calculator, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface COAttainment {
  coId: string;
  coCode: string;
  coDescription: string;
  targetPercentage: number;
  studentsAchieved: number;
  totalStudents: number;
  attainmentPercentage: number;
  attainmentLevel: number; // 0-3 based on thresholds
  levelLabel: string;
}

interface CourseSettings {
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
}

interface COAttainmentsProps {
  courseId: string;
}

export function COAttainments({ courseId }: COAttainmentsProps) {
  const [attainments, setAttainments] = useState<COAttainment[]>([]);
  const [courseSettings, setCourseSettings] = useState<CourseSettings>({
    level1Threshold: 60,
    level2Threshold: 70,
    level3Threshold: 80,
  });
  const [loading, setLoading] = useState(false);
  const [lastCalculated, setLastCalculated] = useState<string | null>(null);

  useEffect(() => {
    fetchAttainments();
    fetchCourseSettings();
  }, [courseId]);

  const fetchAttainments = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would be calculated from actual student marks
      const mockAttainments: COAttainment[] = [
        {
          coId: '1',
          coCode: 'CO1',
          coDescription: 'Apply fundamental programming concepts',
          targetPercentage: 60,
          studentsAchieved: 48,
          totalStudents: 60,
          attainmentPercentage: 80,
          attainmentLevel: 2,
          levelLabel: 'Level 2',
        },
        {
          coId: '2',
          coCode: 'CO2',
          coDescription: 'Design and implement algorithms',
          targetPercentage: 60,
          studentsAchieved: 42,
          totalStudents: 60,
          attainmentPercentage: 70,
          attainmentLevel: 2,
          levelLabel: 'Level 2',
        },
        {
          coId: '3',
          coCode: 'CO3',
          coDescription: 'Analyze algorithm efficiency',
          targetPercentage: 60,
          studentsAchieved: 30,
          totalStudents: 60,
          attainmentPercentage: 50,
          attainmentLevel: 0,
          levelLabel: 'Level 0',
        },
        {
          coId: '4',
          coCode: 'CO4',
          coDescription: 'Develop OOP solutions',
          targetPercentage: 60,
          studentsAchieved: 54,
          totalStudents: 60,
          attainmentPercentage: 90,
          attainmentLevel: 3,
          levelLabel: 'Level 3',
        },
        {
          coId: '5',
          coCode: 'CO5',
          coDescription: 'Evaluate programming paradigms',
          targetPercentage: 60,
          studentsAchieved: 36,
          totalStudents: 60,
          attainmentPercentage: 60,
          attainmentLevel: 1,
          levelLabel: 'Level 1',
        },
      ];
      setAttainments(mockAttainments);
      setLastCalculated(new Date().toLocaleString());
    } catch (error) {
      console.error('Failed to fetch attainments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseSettings = async () => {
    try {
      // Mock data - in real app, this would come from course settings
      const mockSettings: CourseSettings = {
        level1Threshold: 60,
        level2Threshold: 70,
        level3Threshold: 80,
      };
      setCourseSettings(mockSettings);
    } catch (error) {
      console.error('Failed to fetch course settings:', error);
    }
  };

  const calculateAttainmentLevel = (percentage: number): { level: number; label: string } => {
    if (percentage >= courseSettings.level3Threshold) {
      return { level: 3, label: 'Level 3' };
    } else if (percentage >= courseSettings.level2Threshold) {
      return { level: 2, label: 'Level 2' };
    } else if (percentage >= courseSettings.level1Threshold) {
      return { level: 1, label: 'Level 1' };
    } else {
      return { level: 0, label: 'Level 0' };
    }
  };

  const handleRecalculate = async () => {
    setLoading(true);
    try {
      // Mock calculation - in real app, this would recalculate from student marks
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate some changes in calculations
      setAttainments(prev => prev.map(attainment => ({
        ...attainment,
        attainmentPercentage: Math.min(100, attainment.attainmentPercentage + Math.random() * 10 - 5),
        ...calculateAttainmentLevel(attainment.attainmentPercentage + Math.random() * 10 - 5)
      })));
      
      setLastCalculated(new Date().toLocaleString());
      
      toast({
        title: "Success",
        description: "CO attainments recalculated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recalculate CO attainments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: number): string => {
    const colors = {
      0: 'bg-red-100 text-red-800',
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getProgressColor = (percentage: number, target: number): string => {
    if (percentage >= target) return 'bg-green-500';
    if (percentage >= target * 0.8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const stats = {
    totalCOs: attainments.length,
    achievedTarget: attainments.filter(a => a.attainmentPercentage >= a.targetPercentage).length,
    level3: attainments.filter(a => a.attainmentLevel === 3).length,
    level2: attainments.filter(a => a.attainmentLevel === 2).length,
    level1: attainments.filter(a => a.attainmentLevel === 1).length,
    level0: attainments.filter(a => a.attainmentLevel === 0).length,
    averageAttainment: attainments.length > 0 
      ? Math.round(attainments.reduce((sum, a) => sum + a.attainmentPercentage, 0) / attainments.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">CO Attainments</h3>
          <p className="text-sm text-gray-600">
            Final attainment levels for each Course Outcome based on student performance
          </p>
        </div>
        
        <div className="flex gap-2">
          {lastCalculated && (
            <div className="text-sm text-gray-500 flex items-center">
              Last calculated: {lastCalculated}
            </div>
          )}
          <Button
            onClick={handleRecalculate}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Calculating...' : 'Recalculate'}
          </Button>
        </div>
      </div>

      {/* Attainment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attainment</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAttainment}%</div>
            <p className="text-xs text-gray-600">Across all COs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Achieved</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.achievedTarget}/{stats.totalCOs}</div>
            <p className="text-xs text-gray-600">COs meeting target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level 3 Attainment</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.level3}</div>
            <p className="text-xs text-gray-600">Highest level achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level 0 Attainment</CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.level0}</div>
            <p className="text-xs text-gray-600">Below threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attainment Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[3, 2, 1, 0].map((level) => {
              const count = level === 3 ? stats.level3 : level === 2 ? stats.level2 : level === 1 ? stats.level1 : stats.level0;
              const percentage = stats.totalCOs > 0 ? (count / stats.totalCOs) * 100 : 0;
              const labels = { 3: 'Level 3', 2: 'Level 2', 1: 'Level 1', 0: 'Level 0' };
              const colors = { 3: 'bg-green-500', 2: 'bg-blue-500', 1: 'bg-yellow-500', 0: 'bg-red-500' };
              
              return (
                <div key={level} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{labels[level as keyof typeof labels]}</span>
                    <span className="text-sm text-gray-600">{count} COs</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-gray-500 text-center">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attainments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Detailed CO Attainments
          </CardTitle>
          <CardDescription>
            Individual Course Outcome attainment calculations based on {courseSettings.level1Threshold}%/{courseSettings.level2Threshold}%/{courseSettings.level3Threshold}% thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CO Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Students Achieved</TableHead>
                <TableHead>Attainment %</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Attainment Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attainments.map((attainment) => (
                <TableRow key={attainment.coId}>
                  <TableCell className="font-medium">{attainment.coCode}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={attainment.coDescription}>
                      {attainment.coDescription}
                    </div>
                  </TableCell>
                  <TableCell>{attainment.targetPercentage}%</TableCell>
                  <TableCell>
                    {attainment.studentsAchieved}/{attainment.totalStudents}
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      attainment.attainmentPercentage >= attainment.targetPercentage 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {attainment.attainmentPercentage.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <Progress 
                        value={attainment.attainmentPercentage} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLevelColor(attainment.attainmentLevel)}>
                      {attainment.levelLabel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* NBA Compliance Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">NBA Compliance Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-700 mb-2">Attainment Calculation Formula:</p>
              <p className="text-gray-600">
                Attainment % = (Number of students achieving CO target ÷ Total students) × 100
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-700 mb-2">Threshold Logic (as per NBA guidelines):</p>
              <ul className="text-blue-600 space-y-1">
                <li>• <strong>Level 3:</strong> ≥ {courseSettings.level3Threshold}% of students meet CO target</li>
                <li>• <strong>Level 2:</strong> ≥ {courseSettings.level2Threshold}% and &lt; {courseSettings.level3Threshold}% meet target</li>
                <li>• <strong>Level 1:</strong> ≥ {courseSettings.level1Threshold}% and &lt; {courseSettings.level2Threshold}% meet target</li>
                <li>• <strong>Level 0:</strong> &lt; {courseSettings.level1Threshold}% of students meet CO target</li>
              </ul>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-700 mb-1">Course Performance Summary:</p>
              <p className="text-green-600">
                {stats.achievedTarget} out of {stats.totalCOs} COs ({((stats.achievedTarget/stats.totalCOs)*100).toFixed(1)}%) 
                are meeting the target attainment level.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}