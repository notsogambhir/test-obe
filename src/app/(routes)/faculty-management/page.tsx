'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, UserPlus, Search, Loader2, CheckCircle, AlertCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface User {
  id: string;
  email?: string;
  employeeId?: string;
  name: string;
  role: string;
  collegeId?: string;
  programId?: string;
  batchId?: string;
  isActive: boolean;
  college?: {
    name: string;
    code: string;
  };
  program?: {
    name: string;
    code: string;
  };
  batch?: {
    name: string;
  };
  userDepartments?: {
    id: string;
    department: {
      id: string;
      name: string;
      code: string;
    };
    isActive: boolean;
  }[];
}

interface Program {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  description?: string;
  duration?: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function FacultyManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchPrograms();
      fetchDepartments();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Filter based on current user role
        let filteredUsers = data;
        if (user?.role === 'DEPARTMENT') {
          // Department users can see all non-student users in their college
          filteredUsers = data.filter((u: User) => 
            u.collegeId === user.collegeId && u.role !== 'STUDENT'
          );
        } else if (user?.role === 'PROGRAM_COORDINATOR') {
          // Program coordinators can see all non-student users in their program
          filteredUsers = data.filter((u: User) => 
            u.programId === user.programId && u.role !== 'STUDENT'
          );
        } else if (user?.role === 'ADMIN' || user?.role === 'UNIVERSITY') {
          // Admin and University users can see all faculty (non-students) across the system
          filteredUsers = data.filter((u: User) => u.role !== 'STUDENT');
        } else {
          // Program coordinators see faculty in their program only
          filteredUsers = data.filter((u: User) => 
            u.programId === user?.programId && u.role !== 'STUDENT'
          );
        }
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleAssignPrograms = async () => {
    if (!selectedUser || selectedPrograms.length === 0) {
      toast.error('Please select at least one program');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/users/assign-programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          programIds: selectedPrograms,
        }),
      });

      if (response.ok) {
        toast.success('Programs assigned successfully');
        setIsAssignDialogOpen(false);
        setSelectedUser(null);
        setSelectedPrograms([]);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign programs');
      }
    } catch (error) {
      console.error('Error assigning programs:', error);
      toast.error('Failed to assign programs');
    } finally {
      setUpdating(false);
    }
  };

  const openAssignDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedPrograms(user.programId ? [user.programId] : []);
    setIsAssignDialogOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDepartment = !selectedDepartment || selectedDepartment === 'all' || user.collegeId === selectedDepartment;
    const matchesProgram = !selectedProgram || selectedProgram === 'all' || user.programId === selectedProgram;
    return matchesSearch && matchesDepartment && matchesProgram;
  });

  const availablePrograms = programs.filter(program => 
    !selectedDepartment || selectedDepartment === 'all' || program.collegeId === selectedDepartment
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'DEPARTMENT' ? 'Department Faculty' : 
             user?.role === 'PROGRAM_COORDINATOR' ? 'Program Faculty' : 
             user?.role === 'ADMIN' || user?.role === 'UNIVERSITY' ? 'Faculty Management' :
             'Faculty Management'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'DEPARTMENT' ? 'Manage faculty members in your college' :
             user?.role === 'PROGRAM_COORDINATOR' ? 'Manage faculty members in your program' :
             user?.role === 'ADMIN' || user?.role === 'UNIVERSITY' ? 'Manage all faculty members across the institution' :
             'Manage faculty members'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-red-600" />
          <span className="text-lg font-semibold">
            {users.length} {user?.role === 'DEPARTMENT' || user?.role === 'PROGRAM_COORDINATOR' || (user?.role === 'ADMIN' || user?.role === 'UNIVERSITY') ? 'Faculty Members' : 'Program Coordinators'}
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="department">College</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="program">Program</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faculty List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {user?.role === 'DEPARTMENT' ? 'Department Faculty Members' :
             user?.role === 'PROGRAM_COORDINATOR' ? 'Program Faculty Members' :
             user?.role === 'ADMIN' || user?.role === 'UNIVERSITY' ? 'All Faculty Members' :
             'Program Coordinators'}
          </CardTitle>
          <CardDescription>
            {user?.role === 'DEPARTMENT' ? 'View and manage faculty members in your college' :
             user?.role === 'PROGRAM_COORDINATOR' ? 'View and manage faculty members in your program' :
             user?.role === 'ADMIN' || user?.role === 'UNIVERSITY' ? 'View and manage all faculty members across the institution' :
             'Manage program coordinators and assign them to specific programs'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {user?.role === 'DEPARTMENT' || user?.role === 'PROGRAM_COORDINATOR' || (user?.role === 'ADMIN' || user?.role === 'UNIVERSITY') ? 
                 'No faculty members found' : 'No program coordinators found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((userItem) => (
                <div
                  key={userItem.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${!userItem.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userItem.isActive ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <Users className={`h-5 w-5 ${userItem.isActive ? 'text-red-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{userItem.name}</p>
                      <p className="text-sm text-gray-600">{userItem.email}</p>
                      {userItem.employeeId && (
                        <p className="text-xs text-gray-500">ID: {userItem.employeeId}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {userItem.role.replace('_', ' ')}
                        </Badge>
                        {/* Show college for all users except students */}
                        {userItem.college && userItem.role !== 'STUDENT' ? (
                          <Badge variant="secondary" className="text-xs">
                            {userItem.college.name}
                          </Badge>
                        ) : null}
                        {userItem.program && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {userItem.program.name}
                          </Badge>
                        )}
                        <Badge variant={userItem.isActive ? "default" : "secondary"} className="text-xs">
                          {userItem.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(user?.role === 'ADMIN' || user?.role === 'UNIVERSITY') && (userItem.role === 'PROGRAM_COORDINATOR' || userItem.role === 'TEACHER' || userItem.role === 'DEPARTMENT') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignDialog(userItem)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Assign Programs
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Programs Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {user?.role === 'ADMIN' || user?.role === 'UNIVERSITY' ? 'Assign Programs to Faculty Member' : 'Assign Programs to Coordinator'}
            </DialogTitle>
            <DialogDescription>
              Select programs to assign to <strong>{selectedUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="programs">Programs</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {availablePrograms.map((program) => (
                  <div key={program.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={program.id}
                      checked={selectedPrograms.includes(program.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPrograms([...selectedPrograms, program.id]);
                        } else {
                          setSelectedPrograms(selectedPrograms.filter(id => id !== program.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={program.id} className="text-sm font-medium">
                      {program.name} ({program.code})
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      College: {program.collegeId}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            {selectedPrograms.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select at least one program to assign.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignPrograms}
              disabled={updating || selectedPrograms.length === 0}
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign Programs
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}