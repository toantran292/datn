import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { routes } from '@/lib/routes';
import { toast } from '@/lib/toast';
import type { EmailAuthRequest, EmailSignUpRequest } from '@/types/identity';

// Query keys for auth
export const authKeys = {
  me: ['auth', 'me'] as const,
};

// Hook to check authentication status
export function useAuthStatus() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        // Use relative path to match middleware
        return await apiGet('/auth/me');
      } catch (error: any) {
        // If it's a 401, treat as unauthenticated (don't throw)
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          return null;
        }
        // For other errors, throw to trigger error state
        throw error;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for email authentication
export function useEmailAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EmailAuthRequest) => apiPost(routes.api.emailAuth(), data),
    onSuccess: () => {
      toast.success("Signed in successfully");

      // Invalidate auth queries to force refresh
      queryClient.invalidateQueries({ queryKey: authKeys.me });

      // Small delay to ensure cookies are set before redirect
      setTimeout(() => {
        // Use window.location.href for full page reload to ensure middleware runs with fresh cookies
        window.location.href = routes.workspaces();
      }, 200);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Sign in failed";
      toast.error(errorMessage);
    },
  });
}

// Hook for email sign up
export function useEmailSignUp() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: EmailSignUpRequest) => apiPost(routes.api.emailSignUp(), data),
    onSuccess: () => {
      toast.success("Account created successfully! Please check your email to verify your account.");
      router.push(routes.login());
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Sign up failed";
      toast.error(errorMessage);
    },
  });
}

// Hook for forgot password
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => apiPost(routes.api.forgotPassword(), { email }),
    onSuccess: () => {
      toast.success("Password reset email sent! Please check your inbox.");
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to send reset email";
      toast.error(errorMessage);
    },
  });
}

// Hook for reset password
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { token: string; password: string }) =>
      apiPost(routes.api.resetPassword(), data),
    onSuccess: () => {
      toast.success("Password reset successfully! Please sign in with your new password.");
      router.push(routes.login());
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to reset password";
      toast.error(errorMessage);
    },
  });
}
