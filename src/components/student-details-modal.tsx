'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar, BookOpen, User, MapPin, Award } from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  name: string;
  role: string;
  isActive: boolean;
  program?: {
    id: string;
    name: string;
    code: string;
  };
  batch?: {
    id: string;
    name: string;
    startYear: number;
    endYear: number;
  };
  _count: {
    enrollments: number;
  };
}

interface StudentDetailsModalProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
  userRole?: string;
}

export function StudentDetailsModal({ student, open, onClose, userRole }: StudentDetailsModalProps) {
  if (!student) return null;

  const canEdit = userRole === 'DEPARTMENT' || userRole === 'PROGRAM_COORDINATOR';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Student ID</label>
                  <p className="text-lg font-semibold">{student.studentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold">{student.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={student.isActive ? "default" : "secondary"}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Enrollments</label>
                  <div className="flex items-center gap-2 mt-1">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span>{student._count?.enrollments || 0} courses</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Enrollments Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Academic Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Program</label>
                  <div className="flex items-center gap-2 mt-1">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span>{student.program?.name || 'N/A'}</span>
                    {student.program?.code && (
                      <Badge variant="outline">{student.program.code}</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Batch</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{student.batch?.name || 'N/A'}</span>
                    {student.batch && (
                      <span className="text-sm text-gray-500">
                        ({student.batch.startYear}-{student.batch.endYear})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {canEdit && (
              <Button>
                Edit Student
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}