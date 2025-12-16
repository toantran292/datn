"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Card } from "@uts/design-system/ui";
import { routes } from "@/lib/routes";
import { apiPost } from "@/lib/api";
import { toast } from "@/lib/toast";
import { PublicOnlyRoute } from "@/components/auth/route-guard";

function LinkGooglePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Get Google info from URL params (passed from backend)
  const googleSub = searchParams.get("sub");
  const googleEmail = searchParams.get("email");
  const existingEmail = searchParams.get("existing_email");

  useEffect(() => {
    // If missing required params, redirect to login
    if (!googleSub || !googleEmail) {
      router.push(routes.login());
    }
  }, [googleSub, googleEmail, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !googleSub || !googleEmail) return;

    setIsLoading(true);
    setError("");

    try {
      await apiPost(routes.api.linkGoogleWithPassword(), {
        google_sub: googleSub,
        google_email: googleEmail,
        password: password,
      });

      toast.success("Google account linked successfully!");
      // Redirect to workspaces after successful link
      window.location.href = routes.workspaces();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to link Google account";
      if (errorMessage.includes("401") || errorMessage.includes("invalid")) {
        setError("Incorrect password. Please try again.");
      } else {
        setError(errorMessage);
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(routes.login());
  };

  // UTS Brand Logo Component
  const UTSLogo = () => (
    <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-2xl flex items-center justify-center shadow-xl">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );

  if (!googleSub || !googleEmail) {
    return null; // Will redirect in useEffect
  }

  return (
    <PublicOnlyRoute>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] px-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 backdrop-blur-sm p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-white/20 rounded-3xl">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <UTSLogo />
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Link Your Google Account</h1>
              <p className="text-[#64748B] font-medium leading-relaxed">
                An account with email <span className="font-semibold text-[#0F172A]">{existingEmail || googleEmail}</span> already exists.
              </p>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
            </div>

            {/* Google Account Info */}
            <div className="bg-gradient-to-r from-[#F9FAFB] to-[#FFF4E6] rounded-2xl p-4 mb-6 border border-[#E2E8F0]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#0F172A]">Google Account</p>
                  <p className="text-sm text-[#64748B]">{googleEmail}</p>
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-700">
                  Enter your password to link this Google account. After linking, you can sign in with either your password or Google.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#374151] mb-2">
                  Your Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-5 py-4 border-2 border-[#E5E7EB] rounded-2xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-lg"
                  required
                  autoFocus
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] font-semibold py-4 px-6 rounded-2xl transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!password || isLoading}
                  className="flex-1 bg-gradient-to-r from-[#FF8800] to-[#FF7700] hover:from-[#FF7700] hover:to-[#E56600] text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Linking...
                    </span>
                  ) : (
                    "Link & Sign In"
                  )}
                </Button>
              </div>
            </form>

            {/* Forgot Password Link */}
            <div className="text-center mt-6">
              <span
                onClick={() => router.push(routes.forgotPassword())}
                className="text-[#00C4AB] hover:text-[#00B3A0] font-semibold cursor-pointer transition-colors duration-200 hover:underline text-sm"
              >
                Forgot your password?
              </span>
            </div>
          </Card>
        </div>
      </div>
    </PublicOnlyRoute>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-white/20 rounded-3xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Loading...</h1>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LinkGooglePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LinkGooglePageContent />
    </Suspense>
  );
}
