'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CourseCreationDialog } from '@/components/course/course-creation-dialog';
import { CourseStatusDropdown } from '@/components/course/course-status-dropdown';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AuthUser } from '@/lib/auth';
import { canCreateBatch, canCreateCourse } from '@/lib/permissions';
import { 
  BookOpen, 
  Users, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calendar,
  Target,
  ChevronRight,
  Building
} from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  programId: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  program?: {
    id: string;
    name: string;
    code: string;
    college?: {
      name: string;
    };
  };
  _count?: {
    courses: number;
    students: number;
  };
}

interface Course {
  id: string;
  code: string;
  name: string;
  batchId: string;
  semester: string;
  description: string | null | undefined;
  status: 'FUTURE' | 'ACTIVE' | 'COMPLETED';
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    courseOutcomes: number;
    assessments: number;
    enrollments: number;
  };
}

export function BatchCourseManagement() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);

  const [newBatch, setNewBatch] = useState({
    name: '',
    programId: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 4
  });

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    if (!user) return {};
    const token = btoa(JSON.stringify(user));
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    } as Record<string, string>;
  };

  // Fetch batches
  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
        if (data.length > 0 && !selectedBatch) {
          setSelectedBatch(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch batches',
        variant: 'destructive'
      });
    }
  };

  // Fetch courses for selected batch
  const fetchCourses = async (batchId: string) => {
    try {
      const response = await fetch(`/api/courses?batchId=${batchId}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive'
      });
    }
  };

  // Fetch programs
  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBatches(), fetchPrograms()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchCourses(selectedBatch.id);
    }
  }, [selectedBatch]);

  // Create new batch
  const handleCreateBatch = async () => {
    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newBatch)
      });

      if (response.ok) {
        await fetchBatches();
        setIsCreateBatchOpen(false);
        setNewBatch({
          name: '',
          programId: '',
          startYear: new Date().getFullYear(),
          endYear: new Date().getFullYear() + 4
        });
        toast({
          title: 'Success',
          description: 'Batch created successfully'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create batch',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to create batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to create batch',
        variant: 'destructive'
      });
    }
  };

  // Delete course
  const deleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCourses(selectedBatch!.id);
        toast({
          title: 'Success',
          description: 'Course deleted successfully'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete course',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'FUTURE': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Batch & Course Management</h1>
          <p className="text-muted-foreground">Manage batches and their unique courses</p>
        </div>
        {canCreateBatch(user as AuthUser) && (
          <Dialog open={isCreateBatchOpen} onOpenChange={setIsCreateBatchOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
                <DialogDescription>
                  Create a new batch for a specific program
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="batch-name">Batch Name</Label>
                  <Input
                    id="batch-name"
                    value={newBatch.name}
                    onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                    placeholder="e.g., 2021-2025"
                  />
                </div>
                <div>
                  <Label htmlFor="program">Program</Label>
                  <Select value={newBatch.programId} onValueChange={(value) => setNewBatch({ ...newBatch, programId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name} ({program.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-year">Start Year</Label>
                    <Input
                      id="start-year"
                      type="number"
                      value={newBatch.startYear}
                      onChange={(e) => setNewBatch({ ...newBatch, startYear: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-year">End Year</Label>
                    <Input
                      id="end-year"
                      type="number"
                      value={newBatch.endYear}
                      onChange={(e) => setNewBatch({ ...newBatch, endYear: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateBatchOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBatch} disabled={!newBatch.name || !newBatch.programId}>
                  Create Batch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
            <p className="text-xs text-muted-foreground">
              {batches.filter(b => b.isActive).length} active batches
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              {courses.filter(c => c.status === 'ACTIVE').length} active courses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Batch</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedBatch ? selectedBatch.name : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedBatch ? `${selectedBatch._count?.courses || 0} courses` : 'Select a batch'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Selection and Course Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Batches</CardTitle>
            <CardDescription>Select a batch to manage its courses</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedBatch?.id === batch.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => setSelectedBatch(batch)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{batch.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {batch.program?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {batch.startYear} - {batch.endYear}
                      </p>
                    </div>
                    <Badge variant={batch.isActive ? 'default' : 'secondary'}>
                      {batch.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{batch._count?.courses || 0} courses</span>
                    <span>{batch._count?.students || 0} students</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Course Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Courses</CardTitle>
                <CardDescription>
                  {selectedBatch ? `Courses for ${selectedBatch.name}` : 'Select a batch to view courses'}
                </CardDescription>
              </div>
              {selectedBatch && canCreateCourse(user as AuthUser) && (
                <CourseCreationDialog 
                  batch={selectedBatch}
                  onSuccess={() => fetchCourses(selectedBatch.id)}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedBatch ? (
              <div className="space-y-4">
                {/* Course Status Tabs */}
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All ({courses.length})</TabsTrigger>
                    <TabsTrigger value="future">
                      Future ({courses.filter(c => c.status === 'FUTURE').length})
                    </TabsTrigger>
                    <TabsTrigger value="active">
                      Active ({courses.filter(c => c.status === 'ACTIVE').length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      Completed ({courses.filter(c => c.status === 'COMPLETED').length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-4">
                    <CourseTable 
                      courses={courses} 
                      onDelete={deleteCourse}
                    />
                  </TabsContent>
                  
                  <TabsContent value="future" className="mt-4">
                    <CourseTable 
                      courses={courses.filter(c => c.status === 'FUTURE')} 
                      onDelete={deleteCourse}
                    />
                  </TabsContent>
                  
                  <TabsContent value="active" className="mt-4">
                    <CourseTable 
                      courses={courses.filter(c => c.status === 'ACTIVE')} 
                      onDelete={deleteCourse}
                    />
                  </TabsContent>
                  
                  <TabsContent value="completed" className="mt-4">
                    <CourseTable 
                      courses={courses.filter(c => c.status === 'COMPLETED')} 
                      onDelete={deleteCourse}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a batch to view and manage its courses</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CourseTable({ 
  courses, 
  onDelete 
}: { 
  courses: Course[];
  onDelete: (id: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'FUTURE': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No courses found for this batch</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course Code</TableHead>
            <TableHead>Course Name</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium">{course.code}</TableCell>
              <TableCell>{course.name}</TableCell>
              <TableCell>{course.semester}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(course.status)}>
                  {course.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{course._count?.courseOutcomes || 0} COs</span>
                  <span>{course._count?.assessments || 0} Assessments</span>
                  <span>{course._count?.enrollments || 0} Students</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-2">
                  <CourseStatusDropdown course={course as any} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onDelete(course.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}