'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Building2, Edit, Trash2, Plus, Users, GraduationCap, Briefcase } from 'lucide-react';

interface College {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  departments?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  _count: {
    departments: number;
    programs: number;
    users: number;
  };
}

export function CollegeManagement() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/admin/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch colleges",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch colleges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollege = async () => {
    if (!formData.name || !formData.code) {
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "College created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({ name: '', code: '', description: '' });
        fetchColleges();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create college",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create college",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCollege = async () => {
    if (!selectedCollege || !formData.name || !formData.code) {
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/colleges/${selectedCollege.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "College updated successfully",
        });
        setIsEditDialogOpen(false);
        setSelectedCollege(null);
        setFormData({ name: '', code: '', description: '' });
        fetchColleges();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update college",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update college",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCollege = async (college: College) => {
    if (!confirm(`Are you sure you want to delete ${college.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/colleges/${college.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "College deleted successfully",
        });
        fetchColleges();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete college",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete college",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (college: College) => {
    setSelectedCollege(college);
    setFormData({
      name: college.name,
      code: college.code,
      description: college.description || ''
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading colleges...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">College Management</h2>
          <p className="text-muted-foreground">Manage colleges and their basic information</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add College
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New College</DialogTitle>
              <DialogDescription>
                Add a new college to the system. A department with the same name will be automatically created.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">College Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Institute of Technology"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">College Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g., IOT"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the college"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCollege}>
                Create College
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {colleges.map((college) => (
          <Card key={college.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{college.name}</CardTitle>
                </div>
                <Badge variant={college.isActive ? "default" : "secondary"}>
                  {college.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>
                Code: {college.code}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {college.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {college.description}
                </p>
              )}
              
              {college.departments && college.departments.length > 0 && (
                <div className="bg-blue-50 p-2 rounded mb-4">
                  <p className="text-xs text-blue-700 font-medium mb-1">Auto-created Department:</p>
                  <p className="text-sm text-blue-800">{college.departments[0].name} ({college.departments[0].code})</p>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-blue-600">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-lg font-semibold">{college._count.departments}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Departments</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-green-600">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-lg font-semibold">{college._count.programs}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Programs</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-purple-600">
                    <Users className="h-4 w-4" />
                    <span className="text-lg font-semibold">{college._count.users}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(college)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCollege(college)}
                  className="text-red-600 hover:text-red-700"
                  disabled={college._count.departments > 0 || college._count.programs > 0 || college._count.users > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {colleges.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No colleges found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first college
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add College
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit College</DialogTitle>
            <DialogDescription>
              Update college information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">College Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Institute of Technology"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">College Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., IOT"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the college"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCollege}>
              Update College
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}