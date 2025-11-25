'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster-simple';
import { Users, UserCheck, Save, AlertTriangle } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  collegeId?: string;
}

interface Section {
  id: string;
  name: string;
  batchId: string;
  _count?: {
    students: number;
  };
}

interface TeacherAssignment {
  id: string;
  courseId: string;
  sectionId?: string;
  teacherId: string;
  isActive: boolean;
  teacher?: Teacher;
  section?: Section;
}

interface Course {
  id: string;
  code: string;
  name: string;
  batchId: string;
  batch: {
    program: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface TeacherAssignmentProps {
  courseId: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    collegeId?: string;
    programId?: string;
  };
}

export function TeacherAssignment({ courseId, user }: TeacherAssignmentProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [courseLevelAssignment, setCourseLevelAssignment] = useState<TeacherAssignment | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [mode, setMode] = useState<'single' | 'section'>('single');
  const [courseLevelTeacherId, setCourseLevelTeacherId] = useState<string>('');
  const [sectionAssignments, setSectionAssignments] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [initialMode, setInitialMode] = useState<'single' | 'section'>('single');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // const { toast } = useToast(); // Using simple toast system instead

  // Fetch course and assignment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/teacher-assignments`);
        if (response.ok) {
          const data = await response.json();
          setCourse(data.course);
          setAssignments(data.assignments || []);
          setCourseLevelAssignment(data.courseLevelAssignment || null);
          setAvailableTeachers(data.availableTeachers || []);
          setSections(data.sections || []);
          
          // Initialize form state based on current assignments
          if (data.courseLevelAssignment) {
            setMode('single');
            setCourseLevelTeacherId(data.courseLevelAssignment.teacherId);
            setInitialMode('single');
          } else {
            setMode('section');
            const sectionAssigns: { [key: string]: string } = {};
            data.assignments.forEach((assignment: TeacherAssignment) => {
              if (assignment.sectionId) {
                sectionAssigns[assignment.sectionId] = assignment.teacherId;
              }
            });
            setSectionAssignments(sectionAssigns);
            setInitialMode('section');
          }
        }
      } catch (error) {
        console.error('Failed to fetch teacher assignments:', error);
      }
    };

    fetchData();
  }, [courseId]);

  // Track unsaved changes
  useEffect(() => {
    const currentHasChanges = 
      mode !== initialMode ||
      (mode === 'single' && courseLevelTeacherId !== (courseLevelAssignment?.teacherId || '')) ||
      (mode === 'section' && JSON.stringify(sectionAssignments) !== JSON.stringify(
        assignments.reduce((acc, assignment) => {
          if (assignment.sectionId) {
            acc[assignment.sectionId] = assignment.teacherId;
          }
          return acc;
        }, {} as { [key: string]: string })
      ));
    
    setHasUnsavedChanges(currentHasChanges);
  }, [mode, courseLevelTeacherId, sectionAssignments, initialMode, courseLevelAssignment, assignments]);

  const handleModeSwitch = (newMode: 'single' | 'section') => {
    if (hasUnsavedChanges) {
      if (!confirm(`Switching to ${newMode} mode will clear all unsaved changes. Are you sure?`)) {
        return;
      }
    }
    setMode(newMode);
    if (newMode === 'single') {
      setSectionAssignments({});
    } else {
      setCourseLevelTeacherId('');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = mode === 'single' 
        ? { mode, courseLevelTeacherId }
        : { mode, sectionAssignments };

      const response = await fetch(`/api/courses/${courseId}/teacher-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          "Success",
          `Teacher assignments saved successfully in ${data.mode} mode`
        );
        
        // Refresh data
        const refreshResponse = await fetch(`/api/courses/${courseId}/teacher-assignments`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setAssignments(refreshData.assignments || []);
          setCourseLevelAssignment(refreshData.courseLevelAssignment || null);
          setInitialMode(mode);
        }
      } else {
        const error = await response.json();
        toast.error(
          "Error",
          error.error || "Failed to save teacher assignments"
        );
      }
    } catch (error) {
      console.error('Failed to save teacher assignments:', error);
      toast.error(
        "Error",
        "Failed to save teacher assignments"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSectionAssignmentChange = (sectionId: string, teacherId: string) => {
    // Convert "default" back to empty string for storage
    const valueToStore = teacherId === 'default' ? '' : teacherId;
    setSectionAssignments(prev => ({
      ...prev,
      [sectionId]: valueToStore
    }));
  };

  const getTeacherForSection = (sectionId: string) => {
    return assignments.find(a => a.sectionId === sectionId)?.teacher;
  };

  const getSectionStudentCount = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section?._count?.students || 0;
  };

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Faculty Assignment
          </CardTitle>
          <CardDescription>
            Assign teachers to {course.name} ({course.code})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            <strong>Program:</strong> {course.batch?.program?.name || 'N/A'} ({course.batch?.program?.code || 'N/A'})<br />
          </div>
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Mode</CardTitle>
          <CardDescription>
            Choose how you want to assign teachers to this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mode} onValueChange={handleModeSwitch} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single">
                Single Teacher Assignment
              </RadioGroupItem>
              <Label htmlFor="single" className="text-sm font-normal">
                Assign one teacher for the entire course
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="section" id="section">
                Assign by Section
              </RadioGroupItem>
              <Label htmlFor="section" className="text-sm font-normal">
                Assign different teachers to individual sections
              </Label>
            </div>
          </RadioGroup>

          {hasUnsavedChanges && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">You have unsaved changes. Click "Save Assignments" to apply them.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Teacher Mode */}
      {mode === 'single' && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Single Teacher</CardTitle>
            <CardDescription>
              This teacher will be assigned to all sections of the course
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-teacher">Assign a single teacher for the entire course</Label>
              <Select
                value={courseLevelTeacherId}
                onValueChange={setCourseLevelTeacherId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {courseLevelAssignment && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-sm">
                    Currently assigned: <strong>{courseLevelAssignment.teacher?.name}</strong>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section-Based Mode */}
      {mode === 'section' && (
        <Card>
          <CardHeader>
            <CardTitle>Assign by Section</CardTitle>
            <CardDescription>
              Assign different teachers to individual sections. Sections without assignments will use the course default.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sections found for this course. Please create sections first.
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section) => {
                  const currentTeacher = getTeacherForSection(section.id);
                  const studentCount = getSectionStudentCount(section.id);
                  
                  return (
                    <div key={section.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <div className="font-medium mb-2">Section {section.name}</div>
                        <div className="text-sm text-muted-foreground mb-3">
                          {studentCount} students
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`section-${section.id}`}>Assign Teacher</Label>
                          <Select
                            value={sectionAssignments[section.id] || 'default'}
                            onValueChange={(value) => handleSectionAssignmentChange(section.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher or use default" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Use Course Default</SelectItem>
                              {availableTeachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {currentTeacher ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              <UserCheck className="h-3 w-3 mr-1" />
                              {currentTeacher.name}
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            No teacher assigned
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading || !hasUnsavedChanges}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Assignments'}
        </Button>
      </div>
    </div>
  );
}