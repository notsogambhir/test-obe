'use client';

import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    // Make toast available globally
    (window as any).toast = addToast;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-lg border ${
            toast.variant === 'destructive' 
              ? 'bg-destructive text-destructive-foreground border-destructive' 
              : 'bg-background text-foreground border-border'
          }`}
        >
          <div className="font-medium">{toast.title}</div>
          {toast.description && (
            <div className="text-sm opacity-80">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export const toast = {
  success: (title: string, description?: string) => {
    const addToast = (window as any).toast;
    if (addToast) addToast({ title, description, variant: 'default' });
  },
  error: (title: string, description?: string) => {
    const addToast = (window as any).toast;
    if (addToast) addToast({ title, description, variant: 'destructive' });
  },
  info: (title: string, description?: string) => {
    const addToast = (window as any).toast;
    if (addToast) addToast({ title, description, variant: 'default' });
  }
};