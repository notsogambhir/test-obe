'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Users, Plus } from 'lucide-react';
import { useSidebarContext } from '@/contexts/sidebar-context';

interface Section {
  id: string;
  name: string;
  batchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    students: number;
  };
}

interface Student {
  id: string;
  name: string;
  studentId: string;
  email?: string;
  sectionId?: string;
  batchId: string;
  programId: string;
}

interface SectionManagementProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    collegeId?: string;
    programId?: string;
  };
  viewOnly?: boolean;
}

export function SectionManagement({ user, viewOnly = false }: SectionManagementProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [newSectionName, setNewSectionName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sectionsLoading, setSectionsLoading] = useState<boolean>(false);
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
  
  // Use sidebar context for batch selection
  const { selectedBatch } = useSidebarContext();

  // Fetch sections and students when batch is selected
  useEffect(() => {
    if (selectedBatch) {
      const fetchSections = async () => {
        try {
          setSectionsLoading(true);
          const response = await fetch(`/api/sections?batchId=${selectedBatch}`);
          if (response.ok) {
            const data = await response.json();
            setSections(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error('Failed to fetch sections:', error);
        } finally {
          setSectionsLoading(false);
        }
      };
      
      const fetchStudents = async () => {
        try {
          setStudentsLoading(true);
          const response = await fetch(`/api/students?batchId=${selectedBatch}`);
          if (response.ok) {
            const data = await response.json();
            setStudents(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error('Failed to fetch students:', error);
        } finally {
          setStudentsLoading(false);
        }
      };
      
      fetchSections();
      fetchStudents();
    }
  }, [selectedBatch]);

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      toast.error("Section name is required");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSectionName.trim(),
          batchId: selectedBatch,
        }),
      });
      
      if (response.ok) {
        const newSection = await response.json();
        setSections(prev => [...prev, newSection]);
        setNewSectionName('');
        toast.success(`Section "${newSection.name}" created successfully`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create section");
      }
    } catch (error) {
      console.error('Failed to create section:', error);
      toast.error("Failed to create section");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string, sectionName: string) => {
    if (!confirm(`Are you sure you want to delete section "${sectionName}"? All students in this section will become unassigned.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSections(prev => prev.filter(s => s.id !== sectionId));
        // Update students in this section to be unassigned
        setStudents(prev => prev.map(student => 
          student.sectionId === sectionId 
            ? { ...student, sectionId: undefined }
            : student
        ));
        toast.success(`Section "${sectionName}" deleted successfully`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete section");
      }
    } catch (error) {
      console.error('Failed to delete section:', error);
      toast.error("Failed to delete section");
    }
  };

  const handleAssignStudentToSection = async (studentId: string, sectionId: string | null) => {
    // Convert "unassigned" string to null for the API
    const apiSectionId = sectionId === 'unassigned' ? null : sectionId;
    
    try {
      const response = await fetch(`/api/students/${studentId}/section`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sectionId: apiSectionId }),
      });
      
      if (response.ok) {
        setStudents(prev => prev.map(student => 
          student.id === studentId 
            ? { ...student, sectionId: apiSectionId } as Student
            : student
        ));
        toast.success("Student section assignment updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update student section");
      }
    } catch (error) {
      console.error('Failed to update student section:', error);
      toast.error("Failed to update student section");
    }
  };

  const getSectionStudentCount = (sectionId: string) => {
    return students.filter(student => student.sectionId === sectionId).length;
  };

  const getUnassignedStudentCount = () => {
    return students.filter(student => !student.sectionId).length;
  };

  return (
    <div className="space-y-6">
      {/* Section Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Sections
          </CardTitle>
          <CardDescription>
            Create and manage sections for the selected batch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create New Section */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter section name (e.g., A, B, C)"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleCreateSection}
              disabled={loading || !newSectionName.trim() || viewOnly}
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Add Section'}
            </Button>
          </div>
          
          {/* Existing Sections */}
          <div>
            <h4 className="text-sm font-medium mb-3">Existing Sections</h4>
            {sectionsLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading sections...
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No sections found. Create your first section above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div>
                      <div className="font-medium">Section {section.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getSectionStudentCount(section.id)} students
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSection(section.id, section.name)}
                      disabled={viewOnly}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Student Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Students to Sections</CardTitle>
          <CardDescription>
            Assign students to sections within the selected batch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{students.length}</div>
              <div className="text-sm text-blue-600">Total Students</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{getUnassignedStudentCount()}</div>
              <div className="text-sm text-green-600">Unassigned</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{sections.length}</div>
              <div className="text-sm text-purple-600">Sections</div>
            </div>
          </div>
          
          {/* Student List */}
          <div className="border rounded-lg">
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted font-medium text-sm">
              <div>Student Name</div>
              <div>Student ID</div>
              <div>Email</div>
              <div>Assigned Section</div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div key={student.id} className="grid grid-cols-4 gap-4 p-4 border-t hover:bg-muted/50">
                  <div className="font-medium">{student.name}</div>
                  <div>{student.studentId}</div>
                  {student.email && <div className="text-sm text-muted-foreground">{student.email}</div>}
                  <div>
                    <Select
                      value={student.sectionId || 'unassigned'}
                      onValueChange={(value) => handleAssignStudentToSection(student.id, value === 'unassigned' ? null : value)}
                      disabled={viewOnly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}