'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Database, CheckCircle } from 'lucide-react';

export function DatabaseInitializer() {
  const [isChecking, setIsChecking] = useState(true);
  const [needsSeeding, setNeedsSeeding] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      setIsChecking(true);
      const response = await fetch('/api/colleges');
      const colleges = await response.json();
      
      if (Array.isArray(colleges) && colleges.length === 0) {
        setNeedsSeeding(true);
        setMessage('Database needs to be initialized with sample data');
      } else {
        setNeedsSeeding(false);
        setMessage(`Database ready with ${colleges.length} colleges`);
      }
    } catch (error) {
      setNeedsSeeding(true);
      setMessage('Unable to connect to database');
    } finally {
      setIsChecking(false);
    }
  };

  const seedDatabase = async () => {
    try {
      setIsSeeding(true);
      setMessage('Seeding database with sample data...');
      
      const response = await fetch('/api/seed', { method: 'POST' });
      const result = await response.json();
      
      if (response.ok) {
        setNeedsSeeding(false);
        setMessage('Database seeded successfully! Refreshing...');
        
        // Refresh the page to reload data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.error || 'Seeding failed');
      }
    } catch (error) {
      setMessage(`Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Initializing Database</CardTitle>
            <CardDescription>Please wait while we check the database...</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsSeeding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <CardTitle>Database Setup Required</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Click the button below to initialize the database with sample data for testing.
            </p>
            <Button 
              onClick={seedDatabase} 
              disabled={isSeeding}
              className="w-full"
            >
              {isSeeding ? 'Seeding...' : 'Initialize Database'}
            </Button>
            {message && (
              <div className="text-sm text-gray-600 mt-2">
                {message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Database is ready, don't render anything
  return null;
}