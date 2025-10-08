"use client";

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStatus } from '@/hooks/use-auth';
import { routes } from '@/lib/routes';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean; // true = require login, false = require NOT logged in
  fallbackRoute?: string;
}

export function RouteGuard({
  children,
  requireAuth = true,
  fallbackRoute
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: user, isLoading, error } = useAuthStatus();

  // User is authenticated if we have user data and no error
  // If user is null (401 response), they are not authenticated
  const isAuthenticated = !!user && !error;

  useEffect(() => {
    if (isLoading) return; // Wait for auth check to complete

    console.log('RouteGuard:', {
      isLoading,
      user: !!user,
      error: !!error,
      isAuthenticated,
      requireAuth,
      pathname
    });

    // Don't redirect here - middleware already handles it
    // Just log for debugging
    if (requireAuth && !isAuthenticated) {
      console.log('RouteGuard: User not authenticated, middleware should handle redirect');
    } else if (!requireAuth && isAuthenticated) {
      console.log('RouteGuard: User authenticated on auth-only route, middleware should handle redirect');
    }
  }, [isAuthenticated, isLoading, requireAuth, pathname, user, error]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8800] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Middleware handles redirects, so we just render content or loading
  // If user is not authenticated on protected route, middleware will redirect
  // If user is authenticated on auth-only route, middleware will redirect

  return <>{children}</>;
}

// Convenience components for common use cases
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <RouteGuard requireAuth={true}>{children}</RouteGuard>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  return <RouteGuard requireAuth={false}>{children}</RouteGuard>;
}
