'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { useCourseStore } from '@/lib/store/courseStore';
import { Batch } from '@/types/batch';

interface CourseCreationDialogProps {
  batch: Batch;
  onSuccess?: () => void;
}

export function CourseCreationDialog({ batch, onSuccess }: CourseCreationDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });
  const { createCourse, isLoading, error, clearError } = useCourseStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.name.trim()) {
      return;
    }

    try {
      await createCourse({
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: 'FUTURE',
        batchId: batch.id,
        isActive: true,
      });

      // Reset form
      setFormData({
        code: '',
        name: '',
        description: '',
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Add a new course to <span className="font-medium">{batch.name}</span>. 
            Courses are created with "Future" status by default.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Course Code
              </Label>
              <Input
                id="code"
                placeholder="e.g. CS101"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Course Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Introduction to Programming"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Course description (optional)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
            {error && (
              <div className="col-span-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.code.trim() || !formData.name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}