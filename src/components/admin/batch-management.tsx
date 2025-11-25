'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, Edit, Trash2, Plus, Users, BookOpen, Building2, Clock, Filter, Search, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface College {
  id: string;
  name: string;
  code: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  duration: number;
  college: College;
}

interface Batch {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  programId: string;
  program: Program;
  _count: {
    courses: number;
    students: number;
  };
}

export function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [formData, setFormData] = useState({
    programId: '',
    startYear: ''
  });

  const [bulkFormData, setBulkFormData] = useState({
    startYear: ''
  });

  useEffect(() => {
    fetchBatches();
    fetchPrograms();
  }, []);

  useEffect(() => {
    filterBatches();
  }, [batches, searchTerm, statusFilter, collegeFilter]);

  const filterBatches = () => {
    let filtered = batches;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (batch.program.college?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(batch => getBatchStatus(batch) === statusFilter);
    }

    // College filter
    if (collegeFilter !== 'all') {
      filtered = filtered.filter(batch => batch.program.college?.id === collegeFilter);
    }

    setFilteredBatches(filtered);
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/admin/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch batches",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch batches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/admin/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  const handleCreateBatch = async () => {
    if (!formData.programId || !formData.startYear) {
      toast({
        title: "Error",
        description: "Program and start year are required",
        variant: "destructive",
      });
      return;
    }

    // Calculate end year based on program duration
    const selectedProgram = programs.find(p => p.id === formData.programId);
    if (!selectedProgram) {
      toast({
        title: "Error",
        description: "Invalid program selected",
        variant: "destructive",
      });
      return;
    }

    const endYear = parseInt(formData.startYear) + selectedProgram.duration;
    const payload = {
      programId: formData.programId,
      startYear: formData.startYear,
      endYear: endYear.toString()
    };

    try {
      const response = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch created successfully",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchBatches();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create batch",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive",
      });
    }
  };

  const handleBulkCreateBatches = async () => {
    if (!bulkFormData.startYear) {
      toast({
        title: "Error",
        description: "Start year is required",
        variant: "destructive",
      });
      return;
    }

    setIsBulkCreating(true);
    
    try {
      const startYear = parseInt(bulkFormData.startYear);
      const currentYear = new Date().getFullYear();
      
      if (startYear < currentYear - 10 || startYear > currentYear + 10) {
        toast({
          title: "Error",
          description: "Start year must be within reasonable range",
          variant: "destructive",
        });
        setIsBulkCreating(false);
        return;
      }

      // Create batches for all programs
      const batchPromises = programs.map(async (program) => {
        const endYear = startYear + program.duration;
        
        const response = await fetch('/api/admin/batches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            programId: program.id,
            startYear: startYear.toString(),
            endYear: endYear.toString()
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to create batch for ${program.name}: ${error.error || 'Unknown error'}`);
        }

        return response.json();
      });

      const results = await Promise.allSettled(batchPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        toast({
          title: "Success",
          description: `Successfully created ${successful} batch${successful > 1 ? 'es' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`,
        });
        setIsCreateDialogOpen(false);
        resetBulkForm();
        fetchBatches();
      } else {
        toast({
          title: "Error",
          description: "Failed to create any batches",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create batches",
        variant: "destructive",
      });
    } finally {
      setIsBulkCreating(false);
    }
  };

  const handleUpdateBatch = async () => {
    if (!selectedBatch || !formData.programId || !formData.startYear) {
      toast({
        title: "Error",
        description: "Program and start year are required",
        variant: "destructive",
      });
      return;
    }

    // Calculate end year based on program duration
    const selectedProgram = programs.find(p => p.id === formData.programId);
    if (!selectedProgram) {
      toast({
        title: "Error",
        description: "Invalid program selected",
        variant: "destructive",
      });
      return;
    }

    const endYear = parseInt(formData.startYear) + selectedProgram.duration;
    const payload = {
      programId: formData.programId,
      startYear: formData.startYear,
      endYear: endYear.toString()
    };

    try {
      const response = await fetch(`/api/admin/batches/${selectedBatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch updated successfully",
        });
        setIsEditDialogOpen(false);
        setSelectedBatch(null);
        resetForm();
        fetchBatches();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update batch",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update batch",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBatch = async (batch: Batch) => {
    if (!confirm(`Are you sure you want to delete ${batch.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/batches/${batch.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch deleted successfully",
        });
        fetchBatches();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete batch",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete batch",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (batch: Batch) => {
    setSelectedBatch(batch);
    setFormData({
      programId: batch.programId,
      startYear: batch.startYear.toString()
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      programId: '',
      startYear: ''
    });
  };

  const resetBulkForm = () => {
    setBulkFormData({
      startYear: ''
    });
  };

  const getCurrentYear = () => new Date().getFullYear();

  const getBatchStatus = (batch: Batch) => {
    const currentYear = getCurrentYear();
    if (currentYear < batch.startYear) return 'upcoming';
    if (currentYear > batch.endYear) return 'completed';
    return 'ongoing';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Upcoming</Badge>;
      case 'completed':
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Completed</Badge>;
      default:
        return <Badge variant="default" className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />Ongoing</Badge>;
    }
  };

  const getUniqueColleges = () => {
    const collegeMap = new Map<string, College>();
    programs.forEach(program => {
      if (program?.college?.id && program?.college?.name) {
        collegeMap.set(program.college.id, program.college);
      }
    });
    return Array.from(collegeMap.values());
  };

  const getStatistics = () => {
    const total = batches.length;
    const ongoing = batches.filter(b => getBatchStatus(b) === 'ongoing').length;
    const upcoming = batches.filter(b => getBatchStatus(b) === 'upcoming').length;
    const completed = batches.filter(b => getBatchStatus(b) === 'completed').length;
    const totalStudents = batches.reduce((sum, b) => sum + b._count.students, 0);
    const totalCourses = batches.reduce((sum, b) => sum + b._count.courses, 0);

    return { total, ongoing, upcoming, completed, totalStudents, totalCourses };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <div className="text-lg">Loading batches...</div>
        </div>
      </div>
    );
  }

  const stats = getStatistics();
  const uniqueColleges = getUniqueColleges();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Batch Management</h2>
          <p className="text-muted-foreground">Manage student batches and their academic years</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={programs.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>
                Add a new student batch to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {programs.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                  No programs available. Please create a program first.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    <Select
                      value={formData.programId || ''}
                      onValueChange={(value) => {
                        // Reset forms when switching modes
                        if (value === 'all') {
                          resetBulkForm(); // Only reset bulk form when switching to all
                          setFormData(prev => ({ ...prev, programId: 'all' }));
                        } else {
                          resetForm(); // Reset single form when switching to specific program
                          setFormData(prev => ({ ...prev, programId: value }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          🎓 All Programs
                        </SelectItem>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name} ({program.code}) - {program.college?.name || 'Unknown College'} ({program.duration} year{program.duration > 1 ? 's' : ''})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.programId === 'all' ? (
                    // Bulk creation form
                    <div className="space-y-2">
                      <Label htmlFor="bulk-startYear">Start Year</Label>
                      <Input
                        id="bulk-startYear"
                        type="number"
                        min={getCurrentYear() - 10}
                        max={getCurrentYear() + 10}
                        value={bulkFormData.startYear}
                        onChange={(e) => setBulkFormData(prev => ({ ...prev, startYear: e.target.value }))}
                        placeholder="e.g., 2024"
                      />
                      <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                        <div className="font-medium mb-2">Preview:</div>
                        {bulkFormData.startYear && (
                          <div className="space-y-1">
                            {programs.slice(0, 3).map((program) => {
                              const endYear = parseInt(bulkFormData.startYear) + program.duration;
                              return (
                                <div key={program.id} className="text-xs">
                                  • {program.name}: {bulkFormData.startYear}-{endYear} (Batch: {bulkFormData.startYear}-{endYear})
                                </div>
                              );
                            })}
                            {programs.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                ... and {programs.length - 3} more programs
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Single program form
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="startYear">Start Year</Label>
                        <Input
                          id="startYear"
                          type="number"
                          min={getCurrentYear() - 10}
                          max={getCurrentYear() + 10}
                          value={formData.startYear}
                          onChange={(e) => setFormData(prev => ({ ...prev, startYear: e.target.value }))}
                          placeholder="e.g., 2024"
                        />
                      </div>
                      
                      {/* Display calculated end year */}
                      {formData.startYear && formData.programId && formData.programId !== 'all' && (
                        <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                          <div className="font-medium mb-1">Calculated End Year:</div>
                          {(() => {
                            const selectedProgram = programs.find(p => p.id === formData.programId);
                            if (selectedProgram) {
                              const endYear = parseInt(formData.startYear) + selectedProgram.duration;
                              return (
                                <div className="text-base font-normal">
                                  {endYear} ({selectedProgram.duration} year{selectedProgram.duration > 1 ? 's' : ''} program)
                                </div>
                              );
                            }
                            return <div className="text-xs">Select a program to see calculated end year</div>;
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
                resetBulkForm();
              }}>
                Cancel
              </Button>
              <Button 
                onClick={formData.programId === 'all' ? handleBulkCreateBatches : handleCreateBatch} 
                disabled={programs.length === 0 || isBulkCreating}
              >
                {isBulkCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    {formData.programId === 'all' ? `Create ${programs.length} Batches` : 'Create Batch'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All batches in system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ongoing}</div>
            <p className="text-xs text-muted-foreground">Currently active batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Across all batches</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={collegeFilter} onValueChange={setCollegeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by college" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {uniqueColleges.map((college) => (
                  <SelectItem key={college.id} value={college.id}>
                    {college.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batches Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBatches.map((batch) => {
          const status = getBatchStatus(batch);
          const progress = getCurrentYear() - batch.startYear;
          const duration = batch.endYear - batch.startYear;
          const progressPercentage = Math.min(Math.max((progress / duration) * 100, 0), 100);

          return (
            <Card key={batch.id} className="relative hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{batch.name}</CardTitle>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {getStatusBadge(status)}
                    <Badge variant={batch.isActive ? "default" : "secondary"} className="text-xs">
                      {batch.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="space-y-1">
                  <div className="font-medium">{batch.program.name} ({batch.program.code})</div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Building2 className="h-3 w-3" />
                    <span>{batch.program.college?.name || 'Unknown College'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-3 w-3" />
                    <span>{batch.startYear} - {batch.endYear}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Progress Bar for ongoing batches */}
                {status === 'ongoing' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 text-blue-600">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-lg font-semibold">{batch._count.courses}</span>
                    </div>
                    <p className="text-xs text-blue-600">Courses</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 text-green-600">
                      <Users className="h-4 w-4" />
                      <span className="text-lg font-semibold">{batch._count.students}</span>
                    </div>
                    <p className="text-xs text-green-600">Students</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(batch)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBatch(batch)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={batch._count.courses > 0 || batch._count.students > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Warning for batches with dependencies */}
                {(batch._count.courses > 0 || batch._count.students > 0) && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-center space-x-2 text-amber-700 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <span>Cannot delete - has associated data</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBatches.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {batches.length === 0 ? 'No batches found' : 'No batches match your filters'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {batches.length === 0 
              ? programs.length === 0 
                ? 'You need to create a program first before adding batches'
                : 'Get started by creating your first batch'
              : 'Try adjusting your search or filters'
            }
          </p>
          {batches.length === 0 && programs.length > 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          )}
          {searchTerm || statusFilter !== 'all' || collegeFilter !== 'all' ? (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCollegeFilter('all');
              }}
              className="ml-2"
            >
              Clear Filters
            </Button>
          ) : null}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Update batch information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-program">Program</Label>
              <Select
                value={formData.programId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, programId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name} ({program.code}) - {program.college?.name || 'Unknown College'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startYear">Start Year</Label>
                <Input
                  id="edit-startYear"
                  type="number"
                  min={getCurrentYear() - 10}
                  max={getCurrentYear() + 10}
                  value={formData.startYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, startYear: e.target.value }))}
                  placeholder="e.g., 2024"
                />
              </div>
              
              {/* Display calculated end year */}
              {formData.startYear && formData.programId && (
                <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                  <div className="font-medium mb-1">Calculated End Year:</div>
                  {(() => {
                    const selectedProgram = programs.find(p => p.id === formData.programId);
                    if (selectedProgram) {
                      const endYear = parseInt(formData.startYear) + selectedProgram.duration;
                      return (
                        <div className="text-base font-normal">
                          {endYear} ({selectedProgram.duration} year{selectedProgram.duration > 1 ? 's' : ''} program)
                        </div>
                      );
                    }
                    return <div className="text-xs">Select a program to see calculated end year</div>;
                  })()}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedBatch(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBatch}>
              Update Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}