'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger, LogLevel } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Bug, Send } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log detailed error information
    logger.error('React Error Boundary caught an error', {
      context: this.props.context || 'react_error_boundary',
      error,
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId,
        retryCount: this.state.retryCount,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        timestamp: new Date().toISOString(),
      },
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error report in development mode
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error ID:', this.state.errorId);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));

      logger.info('Error boundary retry attempted', {
        context: 'react_error_boundary',
        metadata: {
          errorId: this.state.errorId,
          retryCount: this.state.retryCount + 1,
          maxRetries: this.maxRetries,
        },
      });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });

    logger.info('Error boundary reset', {
      context: 'react_error_boundary',
      metadata: {
        errorId: this.state.errorId,
      },
    });
  };

  sendErrorReport = () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (!error || !errorInfo) return;

    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount,
    };

    // Log the error report
    logger.error('Error report generated', {
      context: 'error_reporting',
      metadata: { errorReport },
    });

    // In a real app, you might send this to a service like Sentry, LogRocket, etc.
    console.log('Error Report:', errorReport);

    // Show user feedback
    alert('Error report has been logged. Error ID: ' + errorId);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Application Error</AlertTitle>
                <AlertDescription>
                  The application encountered an unexpected error. You can try refreshing the page or retrying the action.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Error ID: {this.state.errorId}</Badge>
                  <Badge variant="secondary">
                    Retry {this.state.retryCount}/{this.maxRetries}
                  </Badge>
                </div>
                
                {this.props.context && (
                  <div className="text-sm text-gray-600">
                    Context: <Badge variant="outline">{this.props.context}</Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.retryCount >= this.maxRetries}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry {this.state.retryCount > 0 && `(${this.state.retryCount})`}
                </Button>

                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>

                <Button
                  onClick={this.sendErrorReport}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Report
                </Button>
              </div>

              {/* Show error details in development or if explicitly requested */}
              {(process.env.NODE_ENV === 'development' || this.props.showDetails) && 
               this.state.error && this.state.errorInfo && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Error Details (Development)
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Error Message:</strong>
                      <pre className="mt-1 p-2 bg-red-50 rounded text-red-800 overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </div>

                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 p-2 bg-red-50 rounded text-red-800 overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>

                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 p-2 bg-orange-50 rounded text-orange-800 overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: { context?: string; metadata?: Record<string, any> }) => {
    logger.error('Error caught by error handler', {
      context: errorInfo?.context || 'use_error_handler',
      error,
      metadata: errorInfo?.metadata,
    });
  };
};

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};