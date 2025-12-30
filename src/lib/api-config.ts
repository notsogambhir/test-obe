// API Configuration
export const API_CONFIG = {
  // Use relative URLs - they'll resolve to current domain
  // This works for both local development and Z.ai preview
  BASE_URL: '',
};

// Helper function to create API URLs
export function createApiUrl(path: string): string {
  // Remove leading slash if present and return relative URL
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/${cleanPath}`;
}

// Helper function to get auth headers for API requests
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // For local development, rely on cookies (more secure)
  // For Z.ai preview, use localStorage tokens
  if (typeof window !== 'undefined') {
    const isZaiPreview = window.location.hostname.includes('space.z.ai');
    const token = localStorage.getItem('obe-auth-token');
    
    if (isZaiPreview && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // For local development, also try token if available (fallback mechanism)
    else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// Helper function to save auth token
export function saveAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    const isZaiPreview = window.location.hostname.includes('space.z.ai');
    
    if (isZaiPreview) {
      localStorage.setItem('obe-auth-token', token);
      console.log('Token saved to localStorage for Z.ai preview');
    } else {
      console.log('Local access - using cookie-based auth');
    }
  }
}

// Helper function to clear auth token
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    const isZaiPreview = window.location.hostname.includes('space.z.ai');
    
    if (isZaiPreview) {
      localStorage.removeItem('obe-auth-token');
      console.log('Token cleared from localStorage for Z.ai preview');
    } else {
      console.log('Local access - clearing cookies');
    }
  }
}