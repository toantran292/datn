import { useEffect, useState } from 'react';

/**
 * Hook to ensure authentication is ready before making API calls
 * Useful when redirecting from auth-web to pm-web
 */
export function useAuthReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuthReady = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/pm', '') || 'http://localhost:8080';

        // Quick ping to auth service to ensure session is active
        const response = await fetch(`${apiBase}/auth/me`, {
          method: 'GET',
          credentials: 'include',
        });

        // If 401, we'll be redirected by the interceptor
        // If OK, we're ready
        if (response.ok) {
          setIsReady(true);
        } else {
          // Wait a bit and try again
          setTimeout(() => {
            setIsReady(true); // Proceed anyway, let interceptor handle it
          }, 500);
        }
      } catch (error) {
        // On error, proceed anyway
        setIsReady(true);
      }
    };

    // Small delay to let cookies settle
    const timer = setTimeout(checkAuthReady, 100);

    return () => clearTimeout(timer);
  }, []);

  return isReady;
}
