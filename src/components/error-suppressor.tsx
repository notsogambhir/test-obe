'use client';

import { useEffect } from 'react';

export function ErrorSuppressor() {
  useEffect(() => {
    // Check if we're in a preview environment
    const isPreviewEnvironment = 
      typeof window !== 'undefined' && (
        window.location.hostname.includes('.space.z.ai') ||
        window.location.hostname.includes('preview') ||
        window.location.hostname.includes('vercel.app')
      );

    if (isPreviewEnvironment) {
      // Suppress console errors in preview environments
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleLog = console.log;

      console.error = (...args: any[]) => {
        // Filter out specific errors we want to suppress
        const errorString = args.join(' ');
        
        // Suppress network-related errors
        if (
          errorString.includes('401') ||
          errorString.includes('Unauthorized') ||
          errorString.includes('WebSocket connection failed') ||
          errorString.includes('Failed to fetch') ||
          errorString.includes('NetworkError') ||
          errorString.includes('chunk') ||
          errorString.includes('Loading chunk')
        ) {
          return;
        }
        
        // Call original console.error for other errors
        originalConsoleError.apply(console, args);
      };

      console.warn = (...args: any[]) => {
        const warnString = args.join(' ');
        
        // Suppress WebSocket warnings
        if (
          warnString.includes('WebSocket') ||
          warnString.includes('HMR') ||
          warnString.includes('Hot Module Replacement')
        ) {
          return;
        }
        
        originalConsoleWarn.apply(console, args);
      };

      // Cleanup function to restore original console methods
      return () => {
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.log = originalConsoleLog;
      };
    }
  }, []);

  return null;
}