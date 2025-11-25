'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plus, Edit, Eye, Upload, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Assessment {
  id: string;
  name: string;
  type: 'Internal' | 'External';
  maxMarks: number;
  weightage: number;
  questionsCount: number;
  marksUploaded: boolean;
  createdAt: string;
}

interface AssessmentsProps {
  courseId: string;
}

export function CourseAssessments({ courseId }: AssessmentsProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    name: '',
    type: 'Internal' as 'Internal' | 'External',
    maxMarks: 100,
    weightage: 10,
  });
  const router = useRouter();

  useEffect(() => {
    fetchAssessments();
  }, [courseId]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would be an API call
      const mockAssessments: Assessment[] = [
        {
          id: '1',
          name: 'Mid Term Examination',
          type: 'Internal',
          maxMarks: 50,
          weightage: 20,
          questionsCount: 5,
          marksUploaded: true,
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          name: 'Lab Assessment 1',
          type: 'Internal',
          maxMarks: 30,
          weightage: 15,
          questionsCount: 3,
          marksUploaded: true,
          createdAt: '2024-02-10',
        },
        {
          id: '3',
          name: 'Final Examination',
          type: 'External',
          maxMarks: 100,
          weightage: 50,
          questionsCount: 10,
          marksUploaded: false,
          createdAt: '2024-03-01',
        },
      ];
      setAssessments(mockAssessments);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!newAssessment.name.trim()) {
      toast({
        title: "Error",
        description: "Please provide an assessment name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Mock API call - in real app, this would save to backend
      const assessment: Assessment = {
        id: Date.now().toString(),
        name: newAssessment.name,
        type: newAssessment.type,
        maxMarks: newAssessment.maxMarks,
        weightage: newAssessment.weightage,
        questionsCount: 0,
        marksUploaded: false,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setAssessments(prev => [...prev, assessment]);
      setNewAssessment({ name: '', type: 'Internal', maxMarks: 100, weightage: 10 });
      setIsCreating(false);
      
      toast({
        title: "Success",
        description: "Assessment created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create assessment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageQuestions = (assessmentId: string) => {
    router.push(`/courses/${courseId}/assessments/${assessmentId}/questions`);
  };

  const handleUploadMarks = (assessmentId: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Marks upload from Excel will be available soon",
    });
  };

  const getTypeColor = (type: string) => {
    return type === 'Internal' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const totalWeightage = assessments.reduce((sum, assessment) => sum + assessment.weightage, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Assessments</h3>
          <p className="text-sm text-gray-600">
            Organize and manage evaluation components for this course
          </p>
        </div>
        
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4" />
          Create Assessment
        </Button>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Assessment</DialogTitle>
              <DialogDescription>
                Add a new assessment component to this course
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assessment-name">Assessment Name</Label>
                <Input
                  id="assessment-name"
                  value={newAssessment.name}
                  onChange={(e) => setNewAssessment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mid Term Examination"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assessment-type">Type</Label>
                <Select
                  value={newAssessment.type}
                  onValueChange={(value: 'Internal' | 'External') => 
                    setNewAssessment(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-marks">Maximum Marks</Label>
                  <Input
                    id="max-marks"
                    type="number"
                    value={newAssessment.maxMarks}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, maxMarks: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weightage">Weightage (%)</Label>
                  <Input
                    id="weightage"
                    type="number"
                    value={newAssessment.weightage}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, weightage: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAssessment}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Assessment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Weightage Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weightage Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalWeightage}%</div>
              <p className="text-sm text-gray-600">Total Weightage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {assessments.filter(a => a.type === 'Internal').reduce((sum, a) => sum + a.weightage, 0)}%
              </div>
              <p className="text-sm text-gray-600">Internal Weightage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {assessments.filter(a => a.type === 'External').reduce((sum, a) => sum + a.weightage, 0)}%
              </div>
              <p className="text-sm text-gray-600">External Weightage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Assessment List
          </CardTitle>
          <CardDescription>
            Total {assessments.length} assessments created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No assessments created yet</p>
              <p className="text-sm text-gray-400">Create your first assessment to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Weightage</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Marks Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.name}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(assessment.type)}>
                        {assessment.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{assessment.maxMarks}</TableCell>
                    <TableCell>{assessment.weightage}%</TableCell>
                    <TableCell>{assessment.questionsCount}</TableCell>
                    <TableCell>
                      <Badge className={assessment.marksUploaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {assessment.marksUploaded ? 'Uploaded' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManageQuestions(assessment.id)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Questions
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUploadMarks(assessment.id)}
                          disabled={assessment.questionsCount === 0}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload Marks
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!assessment.marksUploaded}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}