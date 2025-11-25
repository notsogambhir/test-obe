'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Target, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CourseSettings {
  coTarget: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
}

interface OverviewTabProps {
  courseId: string;
}

export function CourseOverview({ courseId }: OverviewTabProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CourseSettings>({
    coTarget: 60,
    level1Threshold: 60,
    level2Threshold: 70,
    level3Threshold: 80,
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isProgramCoordinator = user?.role === 'PROGRAM_COORDINATOR';

  useEffect(() => {
    fetchCourseSettings();
  }, [courseId]);

  const fetchCourseSettings = async () => {
    try {
      // Mock data - in real app, this would be an API call
      const mockSettings: CourseSettings = {
        coTarget: 60,
        level1Threshold: 60,
        level2Threshold: 70,
        level3Threshold: 80,
      };
      setSettings(mockSettings);
    } catch (error) {
      console.error('Failed to fetch course settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!isProgramCoordinator) {
      toast({
        title: "Permission Denied",
        description: "Only Program Coordinators can edit course settings",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Mock API call - in real app, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Course settings updated successfully",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CourseSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Course Overview Settings</h3>
          <p className="text-sm text-gray-600">
            Configure fundamental parameters for course outcome evaluation
          </p>
        </div>
        
        {isProgramCoordinator && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Edit Settings
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Permission Notice */}
      {!isProgramCoordinator && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              <strong>Read-only View:</strong> Only Program Coordinators can edit course settings.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CO Target Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              CO Target Settings
            </CardTitle>
            <CardDescription>
              Define the success criteria for Course Outcomes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="co-target">CO Target Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="co-target"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.coTarget}
                  onChange={(e) => handleInputChange('coTarget', parseInt(e.target.value))}
                  disabled={!isEditing || !isProgramCoordinator}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
              <p className="text-xs text-gray-500">
                Minimum percentage a student must achieve to be considered successful in a CO
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Attainment Level Thresholds */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attainment Level Thresholds
            </CardTitle>
            <CardDescription>
              Configure grading rules for class-level CO attainment (NBA Compliance)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="level1-threshold">Level 1 Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="level1-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.level1Threshold}
                    onChange={(e) => handleInputChange('level1Threshold', parseInt(e.target.value))}
                    disabled={!isEditing || !isProgramCoordinator}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500">
                  Minimum students achieving CO target for Level 1
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level2-threshold">Level 2 Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="level2-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.level2Threshold}
                    onChange={(e) => handleInputChange('level2Threshold', parseInt(e.target.value))}
                    disabled={!isEditing || !isProgramCoordinator}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500">
                  Minimum students achieving CO target for Level 2
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level3-threshold">Level 3 Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="level3-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.level3Threshold}
                    onChange={(e) => handleInputChange('level3Threshold', parseInt(e.target.value))}
                    disabled={!isEditing || !isProgramCoordinator}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500">
                  Minimum students achieving CO target for Level 3
                </p>
              </div>
            </div>

            {/* Threshold Validation */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Threshold Logic:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• <strong>Level 0:</strong> &lt; {settings.level1Threshold}% of students meet CO target</p>
                <p>• <strong>Level 1:</strong> ≥ {settings.level1Threshold}% and &lt; {settings.level2Threshold}% of students meet CO target</p>
                <p>• <strong>Level 2:</strong> ≥ {settings.level2Threshold}% and &lt; {settings.level3Threshold}% of students meet CO target</p>
                <p>• <strong>Level 3:</strong> ≥ {settings.level3Threshold}% of students meet CO target</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}