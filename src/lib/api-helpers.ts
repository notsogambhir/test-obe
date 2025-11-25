import { NextRequest } from 'next/server';
import { AuthUser } from './auth';

export function getAuthHeaders(): Record<string, string> {
  // Get user from localStorage
  const storedUser = localStorage.getItem('obe-user');
  if (!storedUser) {
    return {};
  }

  try {
    const user = JSON.parse(storedUser) as AuthUser;
    // In a real app, you would get the token from secure storage
    // For now, we'll use the user object as a simple token
    const token = btoa(JSON.stringify(user));
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    return {};
  }
}

export function getServerAuthHeaders(request: NextRequest): Record<string, string> {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}