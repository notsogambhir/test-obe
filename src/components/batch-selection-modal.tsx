'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface Batch {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId?: string;
  departmentId?: string;
  programId?: string;
  batchId?: string;
}

export function BatchSelectionModal({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUserSelections } = useAuth();

// Only open the modal if user doesn't have a batchId and hasn't dismissed it before
  useEffect(() => {
    const hasDismissedBatchModal = localStorage.getItem('obe-dismissed-batch-modal');
    if (!user.batchId && user.programId && !hasDismissedBatchModal) {
      setOpen(true);
    }
  }, [user.batchId, user.programId]);

  useEffect(() => {
    if (user.programId) {
      fetchBatches(user.programId);
    }
  }, [user.programId]);

  const fetchBatches = async (programId: string) => {
    try {
      const response = await fetch(`/api/batches?programId=${programId}`);
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const handleBatchSelect = async () => {
    if (!selectedBatch) {
      toast({
        title: "Error",
        description: "Please select a batch",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/update-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: selectedBatch }),
      });

      if (response.ok) {
        // Update local state immediately
        updateUserSelections({ batchId: selectedBatch });
        toast({
          title: "Success",
          description: "Batch selected successfully",
        });
        setOpen(false);
        // Clear the dismissed flag since user has now selected a batch
        localStorage.removeItem('obe-dismissed-batch-modal');
        // The page will automatically update due to auth state change
      } else {
        throw new Error('Failed to update batch');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select batch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('obe-dismissed-batch-modal', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Batch</DialogTitle>
          <DialogDescription>
            Choose your batch to continue with the dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Available Batches</label>
            <Select
              value={selectedBatch}
              onValueChange={setSelectedBatch}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name} ({batch.startYear}-{batch.endYear})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        <div className="flex gap-2">
            <Button 
              onClick={handleBatchSelect}
              className="flex-1" 
              disabled={loading || !selectedBatch}
            >
              {loading ? 'Selecting...' : 'Continue to Dashboard'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              disabled={loading}
            >
              Skip for Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}