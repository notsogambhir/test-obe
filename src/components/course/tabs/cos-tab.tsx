'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download,
  Save,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { courseEvents } from '@/lib/course-events';

interface CO {
  id: string;
  code: string;
  description: string;
  isEditing?: boolean;
}

interface COsTabProps {
  courseId: string;
  courseData?: any;
}

export function COsTab({ courseId, courseData }: COsTabProps) {
  const [cos, setCOs] = useState<CO[]>([]);
  const [newCO, setNewCO] = useState({ description: '' });
  const [editingCO, setEditingCO] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (courseData?.courseOutcomes) {
      setCOs(courseData.courseOutcomes);
    } else {
      fetchCOs();
    }
  }, [courseId, courseData]);

  const fetchCOs = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/cos`);
      if (response.ok) {
        const cosData = await response.json();
        setCOs(cosData || []);
      }
    } catch (error) {
      console.error('Failed to fetch COs:', error);
    }
  };

  const getNextCOCode = () => {
    const maxNumber = Math.max(...cos.map(co => parseInt(co.code.replace('CO', '')) || 0));
    return `CO${maxNumber + 1}`;
  };

  const handleAddCO = async () => {
    if (!newCO.description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a CO description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/cos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newCO.description.trim(),
        }),
      });

      if (response.ok) {
        const createdCO = await response.json();
        setCOs(prev => [...prev, createdCO]);
        setNewCO({ description: '' });
        setIsAddDialogOpen(false);
        // Emit event to notify other tabs
        courseEvents.emit('co-updated');
        toast({
          title: "Success",
          description: `CO ${createdCO.code} added successfully`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add CO",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add CO",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCO = async (coId: string, description: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/cos/${coId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
        }),
      });

      if (response.ok) {
        setCOs(prev => prev.map(co => 
          co.id === coId ? { ...co, description, isEditing: false } : co
        ));
        setEditingCO(null);
        // Emit event to notify other tabs
        courseEvents.emit('co-updated');
        toast({
          title: "Success",
          description: "CO updated successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update CO",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update CO",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCO = async (coId: string) => {
    if (!confirm('Are you sure you want to delete this CO?')) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/cos/${coId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCOs(prev => prev.filter(co => co.id !== coId));
        // Emit event to notify other tabs
        courseEvents.emit('co-updated');
        toast({
          title: "Success",
          description: "CO deleted successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete CO",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete CO",
        variant: "destructive",
      });
    }
  };

  const handleBulkUpload = () => {
    toast({
      title: "[PLACEHOLDER] Coming Soon",
      description: "Bulk upload feature will be available soon",
    });
  };

  const handleDownloadTemplate = () => {
    // [PLACEHOLDER] Create CSV template
    const csvContent = "CO Code,Description\nCO1,Example CO description\nCO2,Another CO description";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'co-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <CardTitle>Course Outcomes (COs)</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button variant="outline" onClick={handleBulkUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add CO
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Course Outcome</DialogTitle>
                    <DialogDescription>
                      Add a new course outcome with description
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="co-code">CO Code</Label>
                      <Input
                        id="co-code"
                        value={getNextCOCode()}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-sm text-gray-500">
                        Next available CO code (auto-generated)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co-description">Description</Label>
                      <Textarea
                        id="co-description"
                        placeholder="Enter CO description..."
                        value={newCO.description}
                        onChange={(e) => setNewCO({ description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddCO} disabled={loading}>
                        {loading ? 'Adding...' : 'Add CO'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <CardDescription>
            Define and manage course outcomes for student assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cos.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Course Outcomes</h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first course outcome
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First CO
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">CO Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cos.map((co) => (
                    <TableRow key={co.id}>
                      <TableCell>
                        <Badge variant="outline">{co.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {editingCO === co.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={co.description}
                              onChange={(e) => setCOs(prev => prev.map(c => 
                                c.id === co.id ? { ...c, description: e.target.value } : c
                              ))}
                              rows={2}
                              className="min-w-0"
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleEditCO(co.id, co.description)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCO(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="max-w-md">
                            <p className="text-sm">{co.description}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingCO !== co.id && (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCO(co.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCO(co.id)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total COs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cos.length}</div>
            <p className="text-xs text-gray-600">Course outcomes defined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">NBA Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cos.length >= 3 ? '✓' : '⚠'}
            </div>
            <p className="text-xs text-gray-600">
              {cos.length >= 3 ? 'Minimum COs met' : 'Need at least 3 COs'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">[Today]</div>
            <p className="text-xs text-gray-600">Most recent change</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}