'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Trash2, Plus } from 'lucide-react';
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

interface SectionCreationProps {
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

export function SectionCreation({ user, viewOnly = false }: SectionCreationProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [newSectionName, setNewSectionName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sectionsLoading, setSectionsLoading] = useState<boolean>(false);
  
  // Use sidebar context for batch selection
  const { selectedBatch } = useSidebarContext();

  // Fetch sections when batch is selected
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
      
      fetchSections();
    }
  }, [selectedBatch]);

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      toast({
        title: 'Error',
        description: 'Section name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedBatch) {
      toast({
        title: 'Error',
        description: 'Please select a batch first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
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
        setSections([...sections, newSection]);
        setNewSectionName('');
        toast({
          title: 'Section Created',
          description: `Section "${newSection.name}" has been created successfully.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to create section',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating section:', error);
      toast({
        title: 'Error',
        description: 'Failed to create section',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string, sectionName: string) => {
    if (!confirm(`Are you sure you want to delete section "${sectionName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSections(sections.filter(section => section.id !== sectionId));
        toast({
          title: 'Section Deleted',
          description: `Section "${sectionName}" has been deleted successfully.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete section',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete section',
        variant: 'destructive',
      });
    }
  };

  // Only show section creation for department role and above
  const canManageSections = ['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(user.role);

  if (!canManageSections) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Section Management
        </CardTitle>
        <CardDescription>
          Create and manage sections for the selected batch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Section */}
        <div>
          <Label htmlFor="section-name">Create New Section</Label>
          <div className="flex gap-2">
            <Input
              id="section-name"
              placeholder="Enter section name (e.g., A, B, C)"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              disabled={viewOnly || !selectedBatch}
              className="flex-1"
            />
            <Button 
              onClick={handleCreateSection}
              disabled={loading || !newSectionName.trim() || viewOnly || !selectedBatch}
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Add Section'}
            </Button>
          </div>
          {!selectedBatch && (
            <p className="text-sm text-muted-foreground mt-2">
              Please select a batch from the sidebar to create sections
            </p>
          )}
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
                      {section._count?.students || 0} students
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSection(section.id, section.name)}
                    disabled={viewOnly}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}