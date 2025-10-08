"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "@uts/design-system/ui";
import { routes } from "@/lib/routes";
import { useForgotPassword } from "@/hooks/use-auth";
import { PublicOnlyRoute } from "@/components/auth/route-guard";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const forgotPasswordMutation = useForgotPassword();

  // UTS Brand Logo Component
  const UTSLogo = () => (
    <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-2xl flex items-center justify-center shadow-xl">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    forgotPasswordMutation.mutate(email, {
      onSuccess: () => {
        setSuccess(true);
      },
    });
  };

  if (success) {
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
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Check Your Email</h1>
              <p className="text-[#64748B] font-medium leading-relaxed">We've sent password reset instructions to your email address</p>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
            </div>

            {/* Success Content */}
            <div className="text-center space-y-8">
              <div className="w-24 h-24 bg-gradient-to-br from-[#00C4AB]/10 to-[#00C4AB]/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-[#00C4AB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="space-y-4">
                <p className="text-[#475569] text-lg">
                  We've sent a password reset link to <span className="font-semibold text-[#0F172A]">{email}</span>
                </p>
                <p className="text-[#64748B]">
                  Click the link in the email to reset your password. If you don't see the email, check your spam folder.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => router.push(routes.login())}
                  className="w-full bg-gradient-to-r from-[#FF8800] to-[#FF7700] hover:from-[#FF7700] hover:to-[#E56600] active:from-[#E56600] active:to-[#CC5500] text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#FF8800]/25"
                >
                  Back to Sign In
                </Button>

                <Button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  variant="outline-primary"
                  className="w-full bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-[#E6FFFB] hover:to-[#CCF7F0] text-[#475569] hover:text-[#00C4AB] font-bold py-4 px-8 rounded-2xl border-2 border-[#E2E8F0] hover:border-[#00C4AB] transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#00C4AB]/25"
                >
                  Send Another Email
                </Button>
              </div>
            </div>
          </Card>
        </div>
        </div>
      </PublicOnlyRoute>
    );
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
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Forgot Password?</h1>
            <p className="text-[#64748B] font-medium leading-relaxed">No worries, we'll send you reset instructions</p>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
          </div>

          {/* Error Banner */}
          {forgotPasswordMutation.error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-5 mb-8 shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{forgotPasswordMutation.error.message}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {forgotPasswordMutation.isPending && (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF8800]/20 border-t-[#FF8800] mx-auto" />
                <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 bg-gradient-to-r from-[#FF8800]/10 to-[#00C4AB]/10 mx-auto" />
              </div>
              <p className="text-[#475569] font-semibold text-lg">Sending reset instructions...</p>
              <p className="text-[#64748B] text-sm mt-2">This will just take a moment</p>
            </div>
          )}

          {/* Form */}
          {!forgotPasswordMutation.isPending && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#374151] mb-3">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-5 py-4 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF8800] to-[#FF7700] hover:from-[#FF7700] hover:to-[#E56600] active:from-[#E56600] active:to-[#CC5500] text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#FF8800]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={!email || forgotPasswordMutation.isPending}
              >
                Send Reset Instructions
              </Button>
            </form>
          )}

          {/* Back to Login */}
          {!forgotPasswordMutation.isPending && (
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
    </PublicOnlyRoute>
  );
}