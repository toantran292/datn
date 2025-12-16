"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@uts/design-system/ui";
import { apiGet, apiPost } from "@/lib/api";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useAuthStatus } from "@/hooks/use-auth";

interface InvitePageProps {
  params: {
    token: string;
  };
}

interface InvitePreview {
  id: string;
  orgId: string;
  orgName: string;
  email: string;
  role: string;
  memberType: string;
}

export default function InviteAcceptPage({ params }: InvitePageProps) {
  const router = useRouter();
  const { token } = params;
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InvitePreview | null>(null);

  // Check authentication status
  const { data: authData, isLoading: isCheckingAuth } = useAuthStatus();
  const isAuthenticated = !!authData;

  // Store invitation token when page loads
  useEffect(() => {
    if (token) {
      localStorage.setItem('pending_invitation_token', token);
    }
  }, [token]);

  // Fetch invitation preview
  useEffect(() => {
    async function fetchPreview() {
      try {
        const data = await apiGet<InvitePreview>(routes.api.invitePreview(token));
        setInviteData(data);
      } catch (err: any) {
        console.error("Failed to load invitation:", err);
        const errorCode = err?.error || err?.message || "unknown";
        if (errorCode === "invitation_not_found") {
          setError("This invitation link is invalid or has expired.");
        } else if (errorCode === "invitation_already_accepted") {
          setError("This invitation has already been accepted.");
        } else {
          setError("Failed to load invitation details. Please try again.");
        }
      } finally {
        setLoadingPreview(false);
      }
    }

    if (token) {
      fetchPreview();
    }
  }, [token]);

  const handleAcceptInvitation = async () => {
    setLoading(true);
    setError(null);

    try {
      await apiPost(routes.api.acceptInvite(), { token });

      toast.success("Invitation accepted successfully!");

      // Clear pending invitation
      localStorage.removeItem('pending_invitation_token');

      // Redirect to workspaces
      setTimeout(() => {
        router.push(routes.workspaces());
      }, 1500);
    } catch (err: any) {
      console.error("Failed to accept invitation:", err);
      const errorCode = err?.error || err?.message || "unknown";

      if (errorCode === "invalid_token" || errorCode === "invitation_not_found") {
        setError("This invitation is no longer valid or has expired.");
      } else if (errorCode === "already_accepted") {
        setError("This invitation has already been accepted.");
      } else {
        setError("Failed to accept invitation. Please try again.");
        toast.error("Failed to accept invitation");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push(routes.login());
  };

  const handleGoToSignUp = () => {
    router.push(routes.signUp());
  };

  // Loading state while checking authentication or fetching preview
  if (isCheckingAuth || loadingPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-transparent to-teal-50 flex items-center justify-center p-6">
        <Card className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-[#FF8800] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading invitation...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-transparent to-teal-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-red-50 border border-red-200 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-900 mb-2">Invitation Not Valid</h2>
            <p className="text-red-700 mb-6">
              {error}
            </p>
            <Button
              onClick={handleGoToLogin}
              variant="outline-primary"
              className="w-full border border-[#00C4AB] text-[#00C4AB] hover:bg-teal-50 font-medium py-3 px-6 rounded-xl transition-all duration-200"
            >
              Return to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const orgName = inviteData?.orgName || "Organization";
  const roleName = inviteData?.role === "ADMIN" ? "Administrator" : "Member";

  // If NOT authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-transparent to-teal-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-lg mb-2">
              Sign in to your Unified TeamSpace account
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                You&apos;ve been invited to join <span className="font-semibold text-[#FF8800]">{orgName}</span> as a <span className="font-semibold text-[#00C4AB]">{roleName}</span>.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Please sign in or create an account to accept this invitation.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-8">
            <Button
              onClick={handleGoToLogin}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200"
            >
              Continue to Sign In
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"/>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <Button
              onClick={() => window.location.href = routes.api.googleOAuth()}
              variant="outline-primary"
              className="w-full border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                onClick={handleGoToSignUp}
                className="text-[#00C4AB] hover:text-teal-600 font-semibold transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our{' '}
              <span className="text-[#00C4AB]">Terms of Service</span> and{' '}
              <span className="text-[#00C4AB]">Privacy Policy</span>.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // If authenticated - show accept invitation UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-transparent to-teal-50 flex items-center justify-center p-6">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-[#FF8800] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Processing your request...</p>
          </Card>
        </div>
      )}

      <Card className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Join {orgName}
          </h1>
          <p className="text-gray-600 leading-relaxed">
            You&apos;ve been invited to join as a <span className="font-semibold text-[#00C4AB]">{roleName}</span>
          </p>
        </div>

        {/* Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-700">
            You will be added to <strong>{orgName}</strong> with your current account.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button
            onClick={handleAcceptInvitation}
            disabled={loading}
            className="w-full bg-[#FF8800] hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00C4AB] focus:ring-opacity-40 focus:ring-offset-2"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Accepting...
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Accept Invitation
              </>
            )}
          </Button>

          <Button
            onClick={() => router.push(routes.workspaces())}
            disabled={loading}
            variant="outline-primary"
            className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition-all duration-200"
          >
            Decline
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            By accepting this invitation, you agree to the organization&apos;s terms and policies.
          </p>
        </div>
      </Card>
    </div>
  );
}
