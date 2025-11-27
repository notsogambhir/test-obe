'use client';

import { useEffect, useCallback, useRef } from 'react';
import { logger, LogLevel } from '@/lib/logger';
import { useAuth } from '@/hooks/use-auth';

interface ErrorTrackerConfig {
  enableConsoleCapture: boolean;
  enableUnhandledRejection: boolean;
  enableNetworkErrorCapture: boolean;
  enablePerformanceMonitoring: boolean;
  trackUserInteractions: boolean;
}

class ClientErrorTracker {
  private config: ErrorTrackerConfig;
  private user: any = null;
  private performanceMetrics: Map<string, number[]> = new Map();
  private interactionStartTime: number = 0;

  constructor(config: Partial<ErrorTrackerConfig> = {}) {
    this.config = {
      enableConsoleCapture: true,
      enableUnhandledRejection: true,
      enableNetworkErrorCapture: true,
      enablePerformanceMonitoring: true,
      trackUserInteractions: true,
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Capture console errors
    if (this.config.enableConsoleCapture) {
      this.setupConsoleCapture();
    }

    // Capture unhandled promise rejections
    if (this.config.enableUnhandledRejection) {
      this.setupUnhandledRejectionCapture();
    }

    // Capture network errors
    if (this.config.enableNetworkErrorCapture) {
      this.setupNetworkErrorCapture();
    }

    // Set up performance monitoring
    if (this.config.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }

    // Track user interactions
    if (this.config.trackUserInteractions) {
      this.setupUserInteractionTracking();
    }

    // Track page visibility changes
    this.setupVisibilityTracking();

    logger.info('Client error tracker initialized', {
      context: 'error_tracker',
      metadata: { config: this.config },
    });
  }

  private setupConsoleCapture(): void {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      logger.error('Console Error', {
        context: 'console_error',
        metadata: {
          args: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ),
          stack: new Error().stack,
        },
      });
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      logger.warn('Console Warning', {
        context: 'console_warning',
        metadata: {
          args: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ),
        },
      });
      originalConsoleWarn.apply(console, args);
    };
  }

  private setupUnhandledRejectionCapture(): void {
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled Promise Rejection', {
        context: 'unhandled_rejection',
        error: event.reason,
        metadata: {
          promise: event.promise.toString(),
          stack: event.reason?.stack,
        },
      });

      // Prevent the default browser behavior
      event.preventDefault();
    });
  }

  private setupNetworkErrorCapture(): void {
    // Override fetch to capture network errors
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0] instanceof Request ? args[0].url : 
                   args[0] instanceof URL ? args[0].toString() : args[0];
      const method = args[0] instanceof Request ? args[0].method : 'GET';

      try {
        const response = await originalFetch.apply(window, args);
        const duration = Date.now() - startTime;

        // Log failed responses
        if (!response.ok) {
          logger.apiError(method, url, new Error(`HTTP ${response.status}`), {
            statusCode: response.status,
            requestBody: args[1]?.body,
          });
        }

        // Log slow requests
        if (duration > 5000) {
          logger.warn(`Slow network request: ${method} ${url}`, {
            context: 'network_performance',
            metadata: { method, url, duration },
          });
        }

        return response;
      } catch (error) {
        logger.apiError(method, url, error, {
          requestBody: args[1]?.body,
        });
        throw error;
      }
    };

    // Override XMLHttpRequest for additional network error capture
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      (this as any)._method = method;
      (this as any)._url = url.toString();
      (this as any)._startTime = Date.now();
      return originalXHROpen.apply(this, [method, url, ...args] as any);
    };

    XMLHttpRequest.prototype.send = function(this: XMLHttpRequest, body?: Document | BodyInit | null) {
      const originalOnReadyStateChange = this.onreadystatechange;
      this.onreadystatechange = function() {
        if (this.readyState === 4) {
          const duration = Date.now() - (this as any)._startTime;
          
          if (this.status >= 400) {
            logger.apiError((this as any)._method, (this as any)._url, 
              new Error(`HTTP ${this.status}`), {
                statusCode: this.status,
                requestBody: body,
              });
          }
        }
        
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.call(this, new Event('readystatechange'));
        }
      };

      return originalXHRSend.call(this, body as any);
    };
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0];
          const loadTime = nav.loadEventEnd - nav.loadEventStart;
          const domTime = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
          
          logger.performanceMetric('page_load', loadTime, {
            metadata: {
              domTime,
              domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
              firstPaint: nav.responseStart - nav.fetchStart,
            },
          });
        }
      }
    });

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long tasks > 50ms
            logger.warn(`Long task detected: ${entry.duration}ms`, {
              context: 'performance',
              metadata: {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              },
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task API might not be supported
        logger.debug('Long task monitoring not supported', {
          context: 'performance',
          metadata: { error: e },
        });
      }
    }
  }

  private setupUserInteractionTracking(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const selector = this.getElementSelector(target);
      
      logger.userAction('click', {
        metadata: {
          selector,
          tagName: target.tagName,
          className: target.className,
          id: target.id,
          text: target.textContent?.slice(0, 50),
          coordinates: { x: event.clientX, y: event.clientY },
        },
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const action = form.action;
      const method = form.method;
      
      logger.userAction('form_submit', {
        metadata: {
          action,
          method,
          formId: form.id,
          formName: form.name,
          fieldCount: form.elements.length,
        },
      });
    });

    // Track input focus
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLInputElement;
      this.interactionStartTime = Date.now();
      
      logger.userAction('input_focus', {
        metadata: {
          inputType: target.type,
          inputName: target.name,
          inputId: target.id,
        },
      });
    }, true);

    // Track input blur (for interaction time)
    document.addEventListener('focusout', (event) => {
      if (this.interactionStartTime > 0) {
        const interactionTime = Date.now() - this.interactionStartTime;
        const target = event.target as HTMLInputElement;
        
        logger.userAction('input_blur', {
          metadata: {
            inputType: target.type,
            inputName: target.name,
            inputId: target.id,
            interactionTime,
          },
        });

        this.interactionStartTime = 0;
      }
    }, true);
  }

  private setupVisibilityTracking(): void {
    document.addEventListener('visibilitychange', () => {
      const isVisible = !document.hidden;
      
      logger.userAction('visibility_change', {
        metadata: {
          isVisible,
          timestamp: Date.now(),
        },
      });
    });
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      return `${element.tagName.toLowerCase()}.${element.className.split(' ').join('.')}`;
    }
    
    return element.tagName.toLowerCase();
  }

  // Public methods
  setUser(user: any): void {
    this.user = user;
    logger.info('User context set for error tracking', {
      context: 'error_tracker',
      metadata: { userId: user?.id, email: user?.email },
    });
  }

  trackCustomEvent(event: string, data?: Record<string, any>): void {
    logger.userAction(`custom_${event}`, {
      metadata: data,
    });
  }

  trackError(error: Error, context?: string, metadata?: Record<string, any>): void {
    logger.error('Custom tracked error', {
      context: context || 'custom_error',
      error,
      metadata,
    });
  }

  trackPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    logger.performanceMetric(operation, duration, {
      metadata,
    });
  }

  getErrorSummary(): any {
    const logs = logger.getLogs(LogLevel.ERROR);
    const errorCounts = logs.reduce((acc, log) => {
      const key = log.message;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: logs.length,
      errorCounts,
      recentErrors: logs.slice(-10),
    };
  }

  destroy(): void {
    // Restore original console methods
    // Note: In a real implementation, you'd want to store references to original methods
    logger.info('Client error tracker destroyed', {
      context: 'error_tracker',
    });
  }
}

// Global error tracker instance
export const errorTracker = new ClientErrorTracker();

// React hook for error tracking
export const useErrorTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      errorTracker.setUser(user);
    }
  }, [user]);

  const trackError = useCallback((error: Error, context?: string, metadata?: Record<string, any>) => {
    errorTracker.trackError(error, context, metadata);
  }, []);

  const trackEvent = useCallback((event: string, data?: Record<string, any>) => {
    errorTracker.trackCustomEvent(event, data);
  }, []);

  const trackPerformance = useCallback((operation: string, duration: number, metadata?: Record<string, any>) => {
    errorTracker.trackPerformance(operation, duration, metadata);
  }, []);

  return {
    trackError,
    trackEvent,
    trackPerformance,
    getErrorSummary: errorTracker.getErrorSummary.bind(errorTracker),
  };
};

// Export for global usage
export { ClientErrorTracker, type ErrorTrackerConfig };