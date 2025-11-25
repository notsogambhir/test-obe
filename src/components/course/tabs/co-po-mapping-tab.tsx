'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Link2, Save, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { courseEvents } from '@/lib/course-events';

interface CourseOutcome {
  id: string;
  code: string;
  description: string;
}

interface ProgramOutcome {
  id: string;
  code: string;
  description: string;
}

interface Mapping {
  coId: string;
  poId: string;
  level: number; // 0-3 scale
}

interface COPOMappingProps {
  courseId: string;
  courseData?: any;
}

export function COPOMappingTab({ courseId, courseData }: COPOMappingProps) {
  const [cos, setCOs] = useState<CourseOutcome[]>([]);
  const [pos, setPOs] = useState<ProgramOutcome[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mappingLevels = [
    { value: 0, label: 'No Mapping', color: 'bg-gray-100 text-gray-800' },
    { value: 1, label: 'Weak', color: 'bg-yellow-100 text-yellow-800' },
    { value: 2, label: 'Medium', color: 'bg-orange-100 text-orange-800' },
    { value: 3, label: 'Strong', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    if (courseId) {
      fetchMappingData();
    }
  }, [courseId, courseData?.batch?.program?.id]);

  const fetchMappingData = async (isRetry = false) => {
    if (!isRetry) {
      setInitialLoading(true);
    }
    setLoading(true);
    setError(null);
    
    try {
      // First fetch course details to get program ID
      const courseResponse = await fetch(`/api/courses/${courseId}`);
      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course details');
      }
      const course = await courseResponse.json();

      // Fetch actual data from APIs
      const [cosResponse, posResponse, mappingsResponse] = await Promise.all([
        fetch(`/api/courses/${courseId}/cos`),
        fetch(`/api/pos?programId=${course.programId || ''}`),
        fetch(`/api/co-po-mappings?courseId=${courseId}`)
      ]);

      // Handle potential errors
      if (!cosResponse.ok) {
        throw new Error('Failed to fetch course outcomes');
      }
      if (!posResponse.ok) {
        throw new Error('Failed to fetch program outcomes');
      }
      if (!mappingsResponse.ok) {
        throw new Error('Failed to fetch CO-PO mappings');
      }

      const [cosData, posData, mappingsData] = await Promise.all([
        cosResponse.json(),
        posResponse.json(),
        mappingsResponse.json()
      ]);

      // Transform CO data
      const transformedCOs: CourseOutcome[] = cosData.map((co: any) => ({
        id: co.id,
        code: co.code,
        description: co.description
      }));

      // Transform PO data
      const transformedPOs: ProgramOutcome[] = posData.map((po: any) => ({
        id: po.id,
        code: po.code,
        description: po.description
      }));

      // Transform mappings data
      const transformedMappings: Mapping[] = mappingsData.map((mapping: any) => ({
        coId: mapping.coId,
        poId: mapping.poId,
        level: mapping.level
      }));

      setCOs(transformedCOs);
      setPOs(transformedPOs);
      setMappings(transformedMappings);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch mapping data:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load CO-PO mapping data";
      setError(errorMessage);
      
      if (!isRetry) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const getMappingLevel = (coId: string, poId: string): number => {
    const mapping = mappings.find(m => m.coId === coId && m.poId === poId);
    return mapping?.level || 0;
  };

  const updateMapping = (coId: string, poId: string, level: number) => {
    setMappings(prev => {
      const existingIndex = prev.findIndex(m => m.coId === coId && m.poId === poId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { coId, poId, level };
        return updated;
      } else {
        return [...prev, { coId, poId, level }];
      }
    });
    setHasChanges(true);
  };

  const handleSaveMappings = async () => {
    setLoading(true);
    try {
      // Prepare mappings for API
      const mappingsToSave = mappings
        .filter(mapping => mapping.level >= 0) // Include all mappings (even 0 level)
        .map(mapping => ({
          coId: mapping.coId,
          poId: mapping.poId,
          level: mapping.level
        }));

      const response = await fetch('/api/co-po-mappings/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          mappings: mappingsToSave
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save CO-PO mappings');
      }

      const result = await response.json();
      
      setHasChanges(false);
      
      // Emit course event to notify other components
      courseEvents.emit('co-updated');
      
      toast({
        title: "Success",
        description: `Successfully saved ${result.count} CO-PO mappings`,
      });
    } catch (error) {
      console.error('Failed to save CO-PO mappings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save CO-PO mappings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMappingStats = () => {
    const totalPossible = cos.length * pos.length;
    const mapped = mappings.filter(m => m.level > 0).length;
    const strong = mappings.filter(m => m.level === 3).length;
    const medium = mappings.filter(m => m.level === 2).length;
    const weak = mappings.filter(m => m.level === 1).length;

    return { totalPossible, mapped, strong, medium, weak };
  };

  const stats = getMappingStats();

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-600">Loading CO-PO mapping data...</p>
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
          onClick={() => fetchMappingData(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">CO-PO Mapping</h3>
          <p className="text-sm text-gray-600">
            Map Course Outcomes to Program Outcomes and define relationship strength
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchMappingData(true)}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleSaveMappings}
            disabled={loading || !hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Mappings'}
          </Button>
        </div>
      </div>

      {/* Mapping Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalPossible}</div>
            <p className="text-xs text-gray-600">Total Possible</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.mapped}</div>
            <p className="text-xs text-gray-600">Mapped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.strong}</div>
            <p className="text-xs text-gray-600">Strong (3)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.medium}</div>
            <p className="text-xs text-gray-600">Medium (2)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.weak}</div>
            <p className="text-xs text-gray-600">Weak (1)</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State Handling */}
      {cos.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Course Outcomes Found</h3>
            <p className="text-sm text-gray-600 mb-4">
              This course doesn't have any Course Outcomes (COs) defined yet. 
              You need to create COs before you can map them to Program Outcomes.
            </p>
            <Button
              onClick={() => fetchMappingData(true)}
              variant="outline"
              className="flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}

      {pos.length === 0 && cos.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Program Outcomes Found</h3>
            <p className="text-sm text-gray-600 mb-4">
              This course's program doesn't have any Program Outcomes (POs) defined yet. 
              You need to create POs before you can map COs to them.
            </p>
            <Button
              onClick={() => fetchMappingData(true)}
              variant="outline"
              className="flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Only show mapping matrix if we have both COs and POs */}
      {cos.length > 0 && pos.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            CO-PO Mapping Matrix
          </CardTitle>
          <CardDescription>
            Select mapping strength for each CO-PO pair (0=No Mapping, 1=Weak, 2=Medium, 3=Strong)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">CO / PO</TableHead>
                  {pos.map((po) => (
                    <TableHead key={po.id} className="min-w-24 text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{po.code}</div>
                        <div className="text-xs text-gray-500 hidden lg:block">
                          {po.description.substring(0, 20)}...
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cos.map((co) => (
                  <TableRow key={co.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{co.code}</div>
                        <div className="text-xs text-gray-500 hidden lg:block">
                          {co.description.substring(0, 25)}...
                        </div>
                      </div>
                    </TableCell>
                    {pos.map((po) => {
                      const currentLevel = getMappingLevel(co.id, po.id);
                      const levelConfig = mappingLevels.find(l => l.value === currentLevel);
                      
                      return (
                        <TableCell key={po.id} className="text-center p-2">
                          <Select
                            value={currentLevel.toString()}
                            onValueChange={(value) => updateMapping(co.id, po.id, parseInt(value))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue>
                                <Badge className={levelConfig?.color || 'bg-gray-100 text-gray-800'}>
                                  {currentLevel}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {mappingLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value.toString()}>
                                  <div className="flex items-center gap-2">
                                    <Badge className={level.color}>
                                      {level.value}
                                    </Badge>
                                    <span className="text-sm">{level.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}
      
      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mapping Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mappingLevels.map((level) => (
              <div key={level.value} className="flex items-center gap-2">
                <Badge className={level.color}>
                  {level.value}
                </Badge>
                <span className="text-sm">{level.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>NBA Guidelines:</strong> CO-PO mapping is essential for outcome-based education. 
              Strong mappings (3) indicate direct correlation, while weak mappings (1) show indirect relationship. 
              This mapping is used to calculate PO attainment from CO results.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Changes Warning */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              <strong>Unsaved Changes:</strong> You have made changes to the CO-PO mapping. Click "Save Mappings" to persist your changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}