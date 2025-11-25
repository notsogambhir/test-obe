'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  program: {
    name: string;
    code: string;
  };
}

interface BatchSelectionProps {
  programId: string;
  selectedBatchId: string | null;
  onBatchSelect: (batchId: string) => void;
  required?: boolean;
}

export function BatchSelection({ programId, selectedBatchId, onBatchSelect, required = false }: BatchSelectionProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/batches?programId=${programId}`);
        
        if (response.ok) {
          const data = await response.json();
          setBatches(data);
        } else {
          setError('Failed to fetch batches');
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
        setError('Error fetching batches');
      } finally {
        setLoading(false);
      }
    };

    if (programId) {
      fetchBatches();
    }
  }, [programId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading batches...
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (batches.length === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="text-center text-gray-600 text-sm">
            No batches found for this program
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="batch-select">
        Select Batch {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={selectedBatchId || ''}
        onValueChange={onBatchSelect}
        required={required}
      >
        <SelectTrigger id="batch-select">
          <SelectValue placeholder="Choose a batch..." />
        </SelectTrigger>
        <SelectContent>
          {batches.map((batch) => (
            <SelectItem key={batch.id} value={batch.id}>
              {batch.name} ({batch.program.name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {required && !selectedBatchId && (
        <p className="text-sm text-red-600">Please select a batch to continue</p>
      )}
    </div>
  );
}