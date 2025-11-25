'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileX, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileX className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Page not found</CardTitle>
          <CardDescription>
            Sorry, we couldn't find the page you're looking for.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-muted-foreground">404</p>
            <p className="text-sm text-muted-foreground mt-2">
              The page you are looking for might have been removed, had its name changed,
              or is temporarily unavailable.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => window.history.back()} variant="outline" className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              Go back
            </Button>
            <Button onClick={() => window.location.href = '/'} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}