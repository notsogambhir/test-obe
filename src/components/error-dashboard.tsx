'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  Bug, 
  Download, 
  Filter, 
  RefreshCw, 
  Search,
  TrendingUp,
  Users,
  Clock,
  Server,
  Database,
  Shield
} from 'lucide-react';
import { logger, LogLevel, LogEntry } from '@/lib/logger';
import { useAuth } from '@/hooks/use-auth';

interface ErrorStats {
  totalErrors: number;
  totalWarnings: number;
  totalInfo: number;
  criticalErrors: number;
  errorsByContext: Record<string, number>;
  errorsByHour: Record<string, number>;
  recentErrors: LogEntry[];
  topErrors: Array<{ message: string; count: number; lastOccurrence: string }>;
}

interface FilterOptions {
  level: LogLevel;
  context: string;
  search: string;
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d' | 'all';
}

export function ErrorDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    level: LogLevel.ERROR,
    context: 'all',
    search: '',
    timeRange: '24h',
  });
  const [loading, setLoading] = useState(true);

  // Load logs and calculate stats
  useEffect(() => {
    loadLogs();
  }, [filters.timeRange]);

  const loadLogs = () => {
    setLoading(true);
    try {
      const allLogs = logger.getLogs();
      const filteredLogs = filterLogs(allLogs, filters);
      setLogs(filteredLogs);
      calculateStats(filteredLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = (allLogs: LogEntry[], filters: FilterOptions): LogEntry[] => {
    let filtered = [...allLogs];

    // Filter by level
    filtered = filtered.filter(log => log.level <= filters.level);

    // Filter by context
    if (filters.context !== 'all') {
      filtered = filtered.filter(log => log.context === filters.context);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.context?.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.metadata || {}).toLowerCase().includes(searchLower)
      );
    }

    // Filter by time range
    if (filters.timeRange !== 'all') {
      const now = Date.now();
      const ranges = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      
      const cutoff = now - ranges[filters.timeRange];
      filtered = filtered.filter(log => 
        new Date(log.timestamp).getTime() > cutoff
      );
    }

    return filtered;
  };

  const calculateStats = (filteredLogs: LogEntry[]) => {
    const errors = filteredLogs.filter(log => log.level === LogLevel.ERROR);
    const warnings = filteredLogs.filter(log => log.level === LogLevel.WARN);
    const infos = filteredLogs.filter(log => log.level === LogLevel.INFO);

    // Critical errors (authentication, database, etc.)
    const criticalContexts = ['auth', 'database', 'api_error', 'security'];
    const criticalErrors = errors.filter(log => 
      criticalContexts.includes(log.context || '')
    );

    // Errors by context
    const errorsByContext = errors.reduce((acc, log) => {
      const context = log.context || 'unknown';
      acc[context] = (acc[context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Errors by hour
    const errorsByHour = errors.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours();
      const key = `${hour}:00`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top errors
    const errorCounts = errors.reduce((acc, log) => {
      const key = log.message;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({
        message,
        count,
        lastOccurrence: errors
          .filter(log => log.message === message)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp || ''
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setStats({
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      totalInfo: infos.length,
      criticalErrors: criticalErrors.length,
      errorsByContext,
      errorsByHour,
      recentErrors: errors.slice(0, 20),
      topErrors,
    });
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `obe-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      logger.clearLogs();
      setLogs([]);
      setStats(null);
    }
  };

  const getContextIcon = (context: string) => {
    const icons: Record<string, React.ReactElement> = {
      auth: <Shield className="h-4 w-4" />,
      database: <Database className="h-4 w-4" />,
      api_error: <Server className="h-4 w-4" />,
      api_request: <Activity className="h-4 w-4" />,
      user_action: <Users className="h-4 w-4" />,
      performance: <TrendingUp className="h-4 w-4" />,
      security: <AlertTriangle className="h-4 w-4" />,
    };
    
    return icons[context] || <Bug className="h-4 w-4" />;
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR: return 'destructive';
      case LogLevel.WARN: return 'secondary';
      case LogLevel.INFO: return 'default';
      default: return 'outline';
    }
  };

  const getLevelName = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR: return 'Error';
      case LogLevel.WARN: return 'Warning';
      case LogLevel.INFO: return 'Info';
      case LogLevel.DEBUG: return 'Debug';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading error logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Error Management Dashboard</h1>
          <p className="text-gray-600">
            Monitor and analyze application errors and performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={clearLogs} variant="destructive" size="sm">
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="level">Log Level</Label>
              <Select
                value={filters.level.toString()}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  level: parseInt(value) as LogLevel 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LogLevel.ERROR.toString()}>Errors Only</SelectItem>
                  <SelectItem value={LogLevel.WARN.toString()}>Warnings & Above</SelectItem>
                  <SelectItem value={LogLevel.INFO.toString()}>Info & Above</SelectItem>
                  <SelectItem value={LogLevel.DEBUG.toString()}>All Logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="context">Context</Label>
              <Select
                value={filters.context}
                onValueChange={(value) => setFilters(prev => ({ ...prev, context: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contexts</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="api_error">API Errors</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="user_action">User Actions</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeRange">Time Range</Label>
              <Select
                value={filters.timeRange}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  timeRange: value as FilterOptions['timeRange']
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Total Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalErrors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500" />
                Critical Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.criticalErrors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-yellow-500" />
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.totalWarnings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Info Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalInfo}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Errors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="top">Top Issues</TabsTrigger>
          <TabsTrigger value="all">All Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentErrors.length === 0 ? (
                <Alert>
                  <AlertTitle>No Recent Errors</AlertTitle>
                  <AlertDescription>
                    Great! No errors have been logged in the selected time range.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {stats?.recentErrors.map((log, index) => (
                    <div key={index} className="border-l-4 border-l-red-500 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLevelColor(log.level)}>
                          {getLevelName(log.level)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        {log.context && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getContextIcon(log.context)}
                            {log.context}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{log.message}</p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer">
                            View Details
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Errors by Context */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Context</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && Object.entries(stats.errorsByContext).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(stats.errorsByContext)
                      .sort(([,a], [,b]) => b - a)
                      .map(([context, count]) => (
                        <div key={context} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getContextIcon(context)}
                            <span className="capitalize">{context.replace('_', ' ')}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No errors to analyze</p>
                )}
              </CardContent>
            </Card>

            {/* Errors by Hour */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Hour (Last 24h)</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && Object.keys(stats.errorsByHour).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(stats.errorsByHour)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([hour, count]) => (
                        <div key={hour} className="flex items-center justify-between">
                          <span>{hour}</span>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 bg-red-500 rounded" 
                              style={{ width: `${Math.min(count * 10, 100)}px` }}
                            />
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No hourly data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top">
          <Card>
            <CardHeader>
              <CardTitle>Top Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.topErrors.length === 0 ? (
                <p className="text-gray-500 text-sm">No recurring issues found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Last Occurrence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.topErrors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {error.message}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{error.count}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(error.lastOccurrence).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Logs ({logs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <Alert>
                  <AlertTitle>No Logs Found</AlertTitle>
                  <AlertDescription>
                    No logs match the current filters.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getLevelColor(log.level)}>
                          {getLevelName(log.level)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        {log.context && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getContextIcon(log.context)}
                            {log.context}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{log.message}</p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer">
                            View Metadata
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}