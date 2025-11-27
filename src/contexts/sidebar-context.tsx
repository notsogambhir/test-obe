'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface College {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  duration: number;
  description?: string;
}

interface Batch {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  programId: string;
}

interface SidebarContextType {
  // Current selections
  selectedCollege: string | null;
  selectedProgram: string | null;
  selectedBatch: string | null;
  
  // Available data
  colleges: College[];
  programs: Program[];
  batches: Batch[];
  
  // Loading states
  loadingPrograms: boolean;
  loadingBatches: boolean;
  
  // Actions
  setSelectedCollege: (collegeId: string | null) => void;
  setSelectedProgram: (programId: string | null) => void;
  setSelectedBatch: (batchId: string | null) => void;
  
  // Context string for API calls
  getContextString: () => string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const { user, updateUserSelections } = useAuth();
  
  // Initialize state from localStorage or fallback to null
  const [selectedCollege, setSelectedCollegeState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('obe-selected-college');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  const [selectedProgram, setSelectedProgramState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('obe-selected-program');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  const [selectedBatch, setSelectedBatchState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('obe-selected-batch');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const isInitialMount = useRef(true);

  // Wrapper functions to update state and localStorage
  const setSelectedCollege = (collegeId: string | null) => {
    setSelectedCollegeState(collegeId);
    if (typeof window !== 'undefined') {
      if (collegeId) {
        localStorage.setItem('obe-selected-college', JSON.stringify(collegeId));
      } else {
        localStorage.removeItem('obe-selected-college');
      }
    }
  };

  const setSelectedProgram = (programId: string | null) => {
    setSelectedProgramState(programId);
    if (typeof window !== 'undefined') {
      if (programId) {
        localStorage.setItem('obe-selected-program', JSON.stringify(programId));
      } else {
        localStorage.removeItem('obe-selected-program');
      }
    }
  };

  const setSelectedBatch = (batchId: string | null) => {
    setSelectedBatchState(batchId);
    if (typeof window !== 'undefined') {
      if (batchId) {
        localStorage.setItem('obe-selected-batch', JSON.stringify(batchId));
      } else {
        localStorage.removeItem('obe-selected-batch');
      }
    }
    // Also update user's batchId if it's different
    if (user && batchId !== user.batchId) {
      updateUserSelections({ batchId: batchId || undefined });
    }
  };

  // Sync with user's batchId when it changes, but only if no localStorage value exists
  useEffect(() => {
    const savedBatch = typeof window !== 'undefined' ? localStorage.getItem('obe-selected-batch') : null;
    if (user?.batchId && user.batchId !== selectedBatch && !savedBatch) {
      setSelectedBatch(user.batchId);
    }
  }, [user?.batchId, selectedBatch]);

  // Sync with user's programId when it changes, but only if no localStorage value exists
  useEffect(() => {
    const savedProgram = typeof window !== 'undefined' ? localStorage.getItem('obe-selected-program') : null;
    if (user?.programId && user.programId !== selectedProgram && !savedProgram) {
      setSelectedProgram(user.programId);
    }
  }, [user?.programId, selectedProgram]);

  // Initialize admin user's college on first load only if no localStorage value exists
  useEffect(() => {
    const savedCollege = typeof window !== 'undefined' ? localStorage.getItem('obe-selected-college') : null;
    if (isInitialMount.current && user?.role === 'ADMIN' && user.collegeId && !selectedCollege && !savedCollege) {
      setSelectedCollege(user.collegeId);
      isInitialMount.current = false;
    }
  }, [user?.role, user?.collegeId, selectedCollege]);

  // Initialize department head's college on first load or clear mismatched localStorage
  useEffect(() => {
    const savedCollege = typeof window !== 'undefined' ? localStorage.getItem('obe-selected-college') : null;
    
    if (user?.role === 'DEPARTMENT' && user.collegeId) {
      // Always ensure department head has their correct college selected
      if (selectedCollege !== user.collegeId) {
        console.log('Department head college synchronization:');
        console.log('User collegeId:', user.collegeId);
        console.log('Current selectedCollege:', selectedCollege);
        console.log('Saved college:', savedCollege);
        
        // Force set the correct college
        setSelectedCollege(user.collegeId);
        
        // Clear any mismatched localStorage
        if (savedCollege && savedCollege !== user.collegeId) {
          console.log('Clearing mismatched localStorage data');
          localStorage.removeItem('obe-selected-college');
          localStorage.removeItem('obe-selected-program');
          localStorage.removeItem('obe-selected-batch');
        }
      }
    }
  }, [user?.role, user?.collegeId, selectedCollege]);

  // Initialize teacher's college on first load or clear mismatched localStorage
  useEffect(() => {
    const savedCollege = typeof window !== 'undefined' ? localStorage.getItem('obe-selected-college') : null;
    
    if (user?.role === 'TEACHER' && user.collegeId) {
      // If there's a saved college that doesn't match the user's assigned college, clear it
      if (savedCollege && savedCollege !== user.collegeId) {
        console.log('Teacher college mismatch detected, clearing localStorage');
        console.log('User collegeId:', user.collegeId);
        console.log('Saved college:', savedCollege);
        setSelectedCollege(user.collegeId);
        localStorage.removeItem('obe-selected-college');
        localStorage.removeItem('obe-selected-program');
        localStorage.removeItem('obe-selected-batch');
      }
      // Set college if not already set
      else if (!selectedCollege && !savedCollege) {
        console.log('Setting teacher college:', user.collegeId);
        setSelectedCollege(user.collegeId);
      }
    }
  }, [user?.role, user?.collegeId, selectedCollege]);

  // Reset initial mount flag when user changes
  useEffect(() => {
    isInitialMount.current = true;
    
    // Force college reset for department heads when user changes
    if (user?.role === 'DEPARTMENT' && user.collegeId) {
      console.log('User changed to department head, forcing college reset to:', user.collegeId);
      setSelectedCollege(user.collegeId);
      // Clear any existing localStorage that might conflict
      localStorage.removeItem('obe-selected-college');
      localStorage.removeItem('obe-selected-program');
      localStorage.removeItem('obe-selected-batch');
    }
  }, [user?.id]);

  // Fetch colleges on mount
  useEffect(() => {
    fetchColleges();
  }, []);

  // Fetch programs when college changes or for teachers/department heads on mount
  useEffect(() => {
    if (selectedCollege) {
      fetchPrograms(selectedCollege);
    } else if ((user?.role === 'TEACHER' || user?.role === 'DEPARTMENT') && user?.collegeId) {
      // For teachers and department heads, fetch programs from their assigned college
      fetchPrograms(user.collegeId);
    } else {
      setPrograms([]);
      setSelectedProgram(null);
      setSelectedBatch(null);
    }
  }, [selectedCollege, user?.role, user?.collegeId]);

  // Fetch batches when program changes
  useEffect(() => {
    if (selectedProgram) {
      fetchBatches(selectedProgram);
    } else {
      setBatches([]);
      setSelectedBatch(null);
    }
  }, [selectedProgram]);

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/colleges');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched colleges:', data.map(c => ({ id: c.id, name: c.name, code: c.code })));
        setColleges(data);
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    }
  };

  const fetchPrograms = async (collegeId: string) => {
    setLoadingPrograms(true);
    try {
      const response = await fetch(`/api/programs?collegeId=${collegeId}`);
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
        // Only reset selections if this is not the teacher's/department head's auto-fetch
        if (!((user?.role === 'TEACHER' || user?.role === 'DEPARTMENT') && collegeId === user.collegeId && !selectedCollege)) {
          setSelectedProgram(null);
          setSelectedBatch(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const fetchBatches = async (programId: string) => {
    setLoadingBatches(true);
    try {
      const response = await fetch(`/api/batches?programId=${programId}`);
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
        // Auto-select newest batch
        if (data.length > 0) {
          setSelectedBatch(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleSetSelectedCollege = (collegeId: string | null) => {
    setSelectedCollege(collegeId);
    // Clear dependent selections
    setSelectedProgram(null);
    setSelectedBatch(null);
  };

  const handleSetSelectedProgram = (programId: string | null) => {
    setSelectedProgram(programId);
    // Clear dependent selection
    setSelectedBatch(null);
  };

  const handleSetSelectedBatch = (batchId: string | null) => {
    setSelectedBatch(batchId);
    // Also update user's batchId if it's different
    if (user && batchId !== user.batchId) {
      updateUserSelections({ batchId: batchId || undefined });
    }
  };

  const getContextString = () => {
    const params = new URLSearchParams();
    if (selectedCollege) params.append('collegeId', selectedCollege);
    if (selectedProgram) params.append('programId', selectedProgram);
    if (selectedBatch) params.append('batchId', selectedBatch);
    return params.toString();
  };

  return (
    <SidebarContext.Provider
      value={{
        selectedCollege,
        selectedProgram,
        selectedBatch,
        colleges,
        programs,
        batches,
        loadingPrograms,
        loadingBatches,
        setSelectedCollege: handleSetSelectedCollege,
        setSelectedProgram: handleSetSelectedProgram,
        setSelectedBatch: handleSetSelectedBatch,
        getContextString,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}