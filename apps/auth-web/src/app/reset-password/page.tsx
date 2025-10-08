"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Card } from "@uts/design-system/ui";
import { routes } from "@/lib/routes";
import { useResetPassword } from "@/hooks/use-auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const resetPasswordMutation = useResetPassword();

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setError("Invalid or missing reset token");
      return;
    }
    setToken(resetToken);
  }, [searchParams]);

  // UTS Brand Logo Component
  const UTSLogo = () => (
    <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-2xl flex items-center justify-center shadow-xl">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword || !token) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setError("");

    resetPasswordMutation.mutate({ token, password }, {
      onSuccess: () => {
        setSuccess(true);
      },
    });
  };

  // Success State
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] px-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 backdrop-blur-sm p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-white/20 rounded-3xl">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <UTSLogo />
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Password Reset Complete</h1>
              <p className="text-[#64748B] font-medium leading-relaxed">Your password has been successfully updated</p>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
            </div>

            {/* Success Content */}
            <div className="text-center space-y-8">
              <div className="w-24 h-24 bg-gradient-to-br from-[#00C4AB]/10 to-[#00C4AB]/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-[#00C4AB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-4">
                <p className="text-[#475569] text-lg font-semibold">
                  Great! Your password has been reset successfully.
                </p>
                <p className="text-[#64748B]">
                  You can now sign in with your new password to access your Unified TeamSpace account.
                </p>
              </div>

              <Button
                onClick={() => router.push(routes.login())}
                className="w-full bg-gradient-to-r from-[#FF8800] to-[#FF7700] hover:from-[#FF7700] hover:to-[#E56600] active:from-[#E56600] active:to-[#CC5500] text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#FF8800]/25"
              >
                Continue to Sign In
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Invalid Token State
  if (!token && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] px-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 backdrop-blur-sm p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-white/20 rounded-3xl">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <UTSLogo />
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Invalid Reset Link</h1>
              <p className="text-[#64748B] font-medium leading-relaxed">This password reset link is invalid or has expired</p>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
            </div>

            {/* Error Content */}
            <div className="text-center space-y-8">
              <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <div className="space-y-4">
                <p className="text-[#475569] text-lg font-semibold">
                  This reset link is no longer valid
                </p>
                <p className="text-[#64748B]">
                  The link may have expired or already been used. Please request a new password reset.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => router.push(routes.forgotPassword())}
                  className="w-full bg-gradient-to-r from-[#FF8800] to-[#FF7700] hover:from-[#FF7700] hover:to-[#E56600] active:from-[#E56600] active:to-[#CC5500] text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#FF8800]/25"
                >
                  Request New Reset Link
                </Button>

                <Button
                  onClick={() => router.push(routes.login())}
                  variant="outline-primary"
                  className="w-full bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-[#E6FFFB] hover:to-[#CCF7F0] text-[#475569] hover:text-[#00C4AB] font-bold py-4 px-8 rounded-2xl border-2 border-[#E2E8F0] hover:border-[#00C4AB] transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#00C4AB]/25"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] px-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-white/20 rounded-3xl">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <UTSLogo />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Reset Your Password</h1>
            <p className="text-[#64748B] font-medium leading-relaxed">Enter your new password below</p>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
          </div>

          {/* Error Banner */}
          {(error || resetPasswordMutation.error) && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-5 mb-8 shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{error || resetPasswordMutation.error?.message}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {resetPasswordMutation.isPending && (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF8800]/20 border-t-[#FF8800] mx-auto" />
                <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 bg-gradient-to-r from-[#FF8800]/10 to-[#00C4AB]/10 mx-auto" />
              </div>
              <p className="text-[#475569] font-semibold text-lg">Updating your password...</p>
              <p className="text-[#64748B] text-sm mt-2">This will just take a moment</p>
            </div>
          )}

          {/* Form */}
          {!resetPasswordMutation.isPending && token && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#374151] mb-3">
                  New Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password (min 8 characters)"
                  className="w-full px-5 py-4 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#374151] mb-3">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full px-5 py-4 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium"
                  required
                />
              </div>

              {/* Password Requirements */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">Password Requirements:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-center">
                    <svg className={`w-4 h-4 mr-2 ${password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    At least 8 characters long
                  </li>
                  <li className="flex items-center">
                    <svg className={`w-4 h-4 mr-2 ${password === confirmPassword && password.length > 0 ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Passwords match
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00C4AB] to-[#00B3A0] hover:from-[#00B3A0] hover:to-[#009B8A] active:from-[#009B8A] active:to-[#008374] text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#00C4AB]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={!password || !confirmPassword || password !== confirmPassword || password.length < 8 || resetPasswordMutation.isPending}
              >
                Update Password
              </Button>
            </form>
          )}

          {/* Back to Login */}
          {!resetPasswordMutation.isPending && (
            <div className="text-center mt-8">
              <button
                onClick={() => router.push(routes.login())}
                className="text-[#64748B] hover:text-[#00C4AB] font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Sign In</span>
              </button>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
}
