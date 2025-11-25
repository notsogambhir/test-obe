'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { logger, LogLevel, LogEntry } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  Shield, 
  Database, 
  Server,
  CheckCircle,
  Info,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  metadata?: Record<string, any>;
  autoClose?: boolean;
  duration?: number;
}

interface NotificationConfig {
  enableDesktop: boolean;
  enableSound: boolean;
  enableToast: boolean;
  enableInApp: boolean;
  desktopTitle: string;
  soundUrl?: string;
  autoCloseDelay: number;
  maxNotifications: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

class ErrorNotificationSystem {
  private config: NotificationConfig;
  private notifications: Notification[] = [];
  private listeners: Array<() => void> = [];
  private requestPermission: NotificationPermission = 'default';

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = {
      enableDesktop: true,
      enableSound: true,
      enableToast: true,
      enableInApp: true,
      desktopTitle: 'OBE Portal Alert',
      autoCloseDelay: 5000,
      maxNotifications: 50,
      ...config,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Request desktop notification permission
    if ('Notification' in window && this.config.enableDesktop) {
      this.requestPermission = await Notification.requestPermission();
    }

    // Set up sound
    if (this.config.enableSound && this.config.soundUrl) {
      this.loadSound();
    }

    // Monitor for critical errors
    this.setupErrorMonitoring();

    logger.info('Error notification system initialized', {
      context: 'notification_system',
      metadata: {
        config: this.config,
        permission: this.requestPermission,
      },
    });
  }

  private setupErrorMonitoring(): void {
    // Monitor logger for new critical errors
    const originalError = logger.error.bind(logger);
    
    logger.error = (message: string, options?: any) => {
      originalError(message, options);
      
      // Check if this is a critical error
      if (this.isCriticalError(message, options?.context, options?.metadata)) {
        this.handleCriticalError(message, options);
      }
    };
  }

  private isCriticalError(message: string, context?: string, metadata?: Record<string, any>): boolean {
    const criticalContexts = ['auth', 'database', 'security', 'api_error'];
    const criticalKeywords = [
      'critical', 'fatal', 'security breach', 'unauthorized access',
      'database connection', 'system failure', 'corruption'
    ];

    // Check context
    if (context && criticalContexts.includes(context)) {
      return true;
    }

    // Check message content
    const lowerMessage = message.toLowerCase();
    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return true;
    }

    // Check metadata for critical indicators
    if (metadata?.statusCode >= 500) {
      return true;
    }

    return false;
  }

  private handleCriticalError(message: string, options?: any): void {
    const notification: Notification = {
      id: this.generateId(),
      type: 'error',
      title: 'Critical Error Detected',
      message: this.formatErrorMessage(message, options?.context),
      timestamp: new Date(),
      persistent: true,
      actions: [
        {
          label: 'View Details',
          action: () => this.showErrorDetails(message, options),
          variant: 'outline',
        },
        {
          label: 'Report Issue',
          action: () => this.reportError(message, options),
          variant: 'default',
        },
      ],
      metadata: options?.metadata,
      autoClose: false,
    };

    this.addNotification(notification);
  }

  private formatErrorMessage(message: string, context?: string): string {
    const contextMessages: Record<string, string> = {
      auth: 'Authentication system error detected',
      database: 'Database operation failed',
      security: 'Security threat detected',
      api_error: 'API system error occurred',
    };

    return contextMessages[context || ''] || message;
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addNotification(notification: Notification): void {
    // Limit notifications
    if (this.notifications.length >= this.config.maxNotifications) {
      this.notifications = this.notifications.slice(-this.config.maxNotifications + 1);
    }

    this.notifications.push(notification);
    this.notifyListeners();

    // Show desktop notification
    if (this.config.enableDesktop && this.requestPermission === 'granted') {
      this.showDesktopNotification(notification);
    }

    // Show toast notification
    if (this.config.enableToast) {
      this.showToastNotification(notification);
    }

    // Auto-close non-persistent notifications
    if (notification.autoClose !== false) {
      const delay = notification.duration || this.config.autoCloseDelay;
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, delay);
    }

    logger.info('Notification added', {
      context: 'notification_system',
      metadata: {
        notificationId: notification.id,
        type: notification.type,
        title: notification.title,
        persistent: notification.persistent,
      },
    });
  }

  private showDesktopNotification(notification: Notification): void {
    if (!('Notification' in window) || this.requestPermission !== 'granted') {
      return;
    }

    const desktopNotif = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.persistent,
    });

    desktopNotif.onclick = () => {
      window.focus();
      if (notification.actions?.length > 0) {
        notification.actions[0].action();
      }
    };

    // Play sound
    if (this.config.enableSound) {
      this.playSound();
    }
  }

  private showToastNotification(notification: Notification): void {
    const toastOptions: any = {
      duration: notification.persistent ? Infinity : (notification.duration || this.config.autoCloseDelay),
    };

    switch (notification.type) {
      case 'error':
        toast.error(notification.message, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.message, toastOptions);
        break;
      case 'success':
        toast.success(notification.message, toastOptions);
        break;
      default:
        toast.info(notification.message, toastOptions);
    }
  }

  private audio: HTMLAudioElement | null = null;

  private loadSound(): void {
    if (this.config.soundUrl && typeof window !== 'undefined') {
      this.audio = new Audio(this.config.soundUrl);
      this.audio.volume = 0.3;
    }
  }

  private playSound(): void {
    if (this.audio) {
      this.audio.play().catch(() => {
        // Ignore sound play errors
      });
    }
  }

  private showErrorDetails(message: string, options?: any): void {
    // Navigate to error dashboard or show error details modal
    logger.error('Error details requested', {
      context: 'notification_system',
      metadata: { originalMessage: message, options },
    });

    // You could navigate to error dashboard here
    window.location.hash = '/admin/error-dashboard';
  }

  private reportError(message: string, options?: any): void {
    const errorReport = {
      message,
      context: options?.context,
      metadata: options?.metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    logger.error('Error reported by user', {
      context: 'notification_system',
      metadata: { errorReport },
    });

    // In a real app, send this to your error reporting service
    console.log('Error Report:', errorReport);
    
    toast.success('Error report submitted. Thank you!');
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Public methods
  public addCustomNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    this.addNotification({ ...notification, id: this.generateId(), timestamp: new Date() });
  }

  public removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  public clearNotifications(): void {
    this.notifications = [];
    this.notifyListeners();
    
    logger.info('All notifications cleared', {
      context: 'notification_system',
    });
  }

  public markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      // Mark as read (you could add a read property)
      this.notifyListeners();
    }
  }

  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.persistent).length;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Global notification system instance
export const notificationSystem = new ErrorNotificationSystem({
  enableDesktop: true,
  enableSound: true,
  enableToast: true,
  enableInApp: true,
  desktopTitle: 'OBE Portal Alert',
  autoCloseDelay: 5000,
  maxNotifications: 50,
});

// React Provider
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationSystem.subscribe(() => {
      setNotifications(notificationSystem.getNotifications());
    });

    // Initial load
    setNotifications(notificationSystem.getNotifications());

    return unsubscribe;
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    notificationSystem.addCustomNotification(notification);
  }, []);

  const removeNotification = useCallback((id: string) => {
    notificationSystem.removeNotification(id);
  }, []);

  const clearNotifications = useCallback(() => {
    notificationSystem.clearNotifications();
  }, []);

  const markAsRead = useCallback((id: string) => {
    notificationSystem.markAsRead(id);
  }, []);

  const unreadCount = notificationSystem.getUnreadCount();

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications,
      markAsRead,
      unreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook for using notifications
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

// Notification Component
export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card key={notification.id} className={`w-full ${getTypeColor(notification.type)}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {getIcon(notification.type)}
                {notification.title}
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeNotification(notification.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{notification.message}</p>
            <div className="text-xs text-gray-500 mt-2">
              {notification.timestamp.toLocaleString()}
            </div>
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || 'default'}
                    onClick={action.action}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Convenience functions for common notifications
export const notifyError = (message: string, options?: Partial<Notification>) => {
  notificationSystem.addCustomNotification({
    type: 'error',
    title: 'Error',
    message,
    ...options,
  });
};

export const notifyWarning = (message: string, options?: Partial<Notification>) => {
  notificationSystem.addCustomNotification({
    type: 'warning',
    title: 'Warning',
    message,
    ...options,
  });
};

export const notifySuccess = (message: string, options?: Partial<Notification>) => {
  notificationSystem.addCustomNotification({
    type: 'success',
    title: 'Success',
    message,
    ...options,
  });
};

export const notifyInfo = (message: string, options?: Partial<Notification>) => {
  notificationSystem.addCustomNotification({
    type: 'info',
    title: 'Information',
    message,
    ...options,
  });
};