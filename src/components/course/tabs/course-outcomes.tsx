'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plus, Edit2, Trash2, Upload, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CourseOutcome {
  id: string;
  code: string;
  description: string;
  bloomsLevel: string;
}

interface CourseOutcomesProps {
  courseId: string;
}

export function CourseOutcomes({ courseId }: CourseOutcomesProps) {
  const [outcomes, setOutcomes] = useState<CourseOutcome[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingCO, setIsAddingCO] = useState(false);
  const [editingCO, setEditingCO] = useState<CourseOutcome | null>(null);
  const [newCO, setNewCO] = useState({
    code: '',
    description: '',
    bloomsLevel: 'L3',
  });

  const bloomsLevels = [
    { value: 'L1', label: 'L1 - Remember' },
    { value: 'L2', label: 'L2 - Understand' },
    { value: 'L3', label: 'L3 - Apply' },
    { value: 'L4', label: 'L4 - Analyze' },
    { value: 'L5', label: 'L5 - Evaluate' },
    { value: 'L6', label: 'L6 - Create' },
  ];

  useEffect(() => {
    fetchCourseOutcomes();
  }, [courseId]);

  const fetchCourseOutcomes = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would be an API call
      const mockOutcomes: CourseOutcome[] = [
        {
          id: '1',
          code: 'CO1',
          description: 'Apply fundamental programming concepts to solve computational problems',
          bloomsLevel: 'L3',
        },
        {
          id: '2',
          code: 'CO2',
          description: 'Design and implement algorithms using appropriate data structures',
          bloomsLevel: 'L4',
        },
        {
          id: '3',
          code: 'CO3',
          description: 'Analyze the efficiency of algorithms in terms of time and space complexity',
          bloomsLevel: 'L4',
        },
        {
          id: '4',
          code: 'CO4',
          description: 'Develop software solutions using object-oriented programming principles',
          bloomsLevel: 'L3',
        },
        {
          id: '5',
          code: 'CO5',
          description: 'Evaluate and compare different programming paradigms for problem-solving',
          bloomsLevel: 'L5',
        },
      ];
      setOutcomes(mockOutcomes);
    } catch (error) {
      console.error('Failed to fetch course outcomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextCOCode = () => {
    if (outcomes.length === 0) return 'CO1';
    const lastCO = outcomes[outcomes.length - 1];
    const lastNumber = parseInt(lastCO.code.replace('CO', ''));
    return `CO${lastNumber + 1}`;
  };

  const handleAddCO = async () => {
    if (!newCO.description.trim()) {
      toast({
        title: "Error",
        description: "Please provide a description for the Course Outcome",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Mock API call - in real app, this would save to backend
      const newOutcome: CourseOutcome = {
        id: Date.now().toString(),
        code: newCO.code || getNextCOCode(),
        description: newCO.description,
        bloomsLevel: newCO.bloomsLevel,
      };

      setOutcomes(prev => [...prev, newOutcome]);
      setNewCO({ code: '', description: '', bloomsLevel: 'L3' });
      setIsAddingCO(false);
      
      toast({
        title: "Success",
        description: "Course Outcome added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add Course Outcome",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCO = async () => {
    if (!editingCO || !editingCO.description.trim()) {
      toast({
        title: "Error",
        description: "Please provide a description for the Course Outcome",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Mock API call - in real app, this would update backend
      setOutcomes(prev => 
        prev.map(co => co.id === editingCO.id ? editingCO : co)
      );
      setEditingCO(null);
      
      toast({
        title: "Success",
        description: "Course Outcome updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Course Outcome",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCO = async (coId: string) => {
    if (!confirm('Are you sure you want to delete this Course Outcome?')) {
      return;
    }

    setLoading(true);
    try {
      // Mock API call - in real app, this would delete from backend
      setOutcomes(prev => prev.filter(co => co.id !== coId));
      
      toast({
        title: "Success",
        description: "Course Outcome deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete Course Outcome",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Bulk upload from Excel will be available soon",
    });
  };

  const getBloomsColor = (level: string) => {
    const colors: Record<string, string> = {
      'L1': 'bg-green-100 text-green-800',
      'L2': 'bg-blue-100 text-blue-800',
      'L3': 'bg-yellow-100 text-yellow-800',
      'L4': 'bg-orange-100 text-orange-800',
      'L5': 'bg-red-100 text-red-800',
      'L6': 'bg-purple-100 text-purple-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Course Outcomes (COs)</h3>
          <p className="text-sm text-gray-600">
            Define and manage the learning outcomes for this course
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBulkUpload}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload COs
          </Button>
          
          <Dialog open={isAddingCO} onOpenChange={setIsAddingCO}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add CO
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Course Outcome</DialogTitle>
                <DialogDescription>
                  Create a new Course Outcome for this course
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="co-code">CO Code</Label>
                  <Input
                    id="co-code"
                    value={newCO.code || getNextCOCode()}
                    onChange={(e) => setNewCO(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Auto-generated"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="co-description">Description</Label>
                  <Textarea
                    id="co-description"
                    value={newCO.description}
                    onChange={(e) => setNewCO(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter the Course Outcome description..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blooms-level">Bloom's Taxonomy Level</Label>
                  <select
                    id="blooms-level"
                    value={newCO.bloomsLevel}
                    onChange={(e) => setNewCO(prev => ({ ...prev, bloomsLevel: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    {bloomsLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingCO(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddCO}
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add CO'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* COs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Course Outcomes List
          </CardTitle>
          <CardDescription>
            Total {outcomes.length} Course Outcomes defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {outcomes.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No Course Outcomes defined yet</p>
              <p className="text-sm text-gray-400">Add your first Course Outcome to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CO Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Bloom's Level</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outcomes.map((outcome) => (
                  <TableRow key={outcome.id}>
                    <TableCell className="font-medium">{outcome.code}</TableCell>
                    <TableCell>
                      {editingCO?.id === outcome.id ? (
                        <Textarea
                          value={editingCO.description}
                          onChange={(e) => setEditingCO(prev => prev ? { ...prev, description: e.target.value } : null)}
                          className="min-h-[60px]"
                        />
                      ) : (
                        <span className="text-sm">{outcome.description}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCO?.id === outcome.id ? (
                        <select
                          value={editingCO.bloomsLevel}
                          onChange={(e) => setEditingCO(prev => prev ? { ...prev, bloomsLevel: e.target.value } : null)}
                          className="p-1 border rounded text-sm"
                        >
                          {bloomsLevels.map(level => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge className={getBloomsColor(outcome.bloomsLevel)}>
                          {outcome.bloomsLevel}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingCO?.id === outcome.id ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={handleEditCO}
                            disabled={loading}
                          >
                            {loading ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCO(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCO(outcome)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCO(outcome.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add CO Form (Always visible at bottom) */}
      {!isAddingCO && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Add Course Outcome</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter Course Outcome description..."
                value={newCO.description}
                onChange={(e) => setNewCO(prev => ({ ...prev, description: e.target.value }))}
                className="flex-1"
              />
              <select
                value={newCO.bloomsLevel}
                onChange={(e) => setNewCO(prev => ({ ...prev, bloomsLevel: e.target.value }))}
                className="p-2 border rounded-md"
              >
                {bloomsLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.value}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAddCO}
                disabled={loading || !newCO.description.trim()}
              >
                Add CO
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}