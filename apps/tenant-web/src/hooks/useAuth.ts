import { useState, useEffect } from 'react';
import { apiGet } from '../lib/api';

export interface User {
  user_id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        // Call /auth/me endpoint to verify authentication
        const user = await apiGet<User>('/auth/me');

        if (mounted) {
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: error as Error,
          });

          // Redirect to auth-web login if not authenticated
          if ((error as any)?.status === 401) {
            window.location.href = 'http://localhost:3000/login';
          }
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
