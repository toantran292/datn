"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "@uts/design-system/ui";
import { routes } from "@/lib/routes";
import { useEmailSignUp } from "@/hooks/use-auth";
import { PublicOnlyRoute } from "@/components/auth/route-guard";
import type { EmailSignUpRequest } from "@/types/identity";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const emailSignUpMutation = useEmailSignUp();

  // UTS Brand Logo Component
  const UTSLogo = () => (
    <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-2xl flex items-center justify-center shadow-xl">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );

  const handleGoogleSignUp = () => {
    window.location.href = routes.api.googleOAuth();
  };

  const handleEmailSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !firstName || !lastName) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setError("");

    const signUpData: EmailSignUpRequest = {
      email,
      password,
      firstName,
      lastName
    };
    emailSignUpMutation.mutate(signUpData);
  };

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
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Join Unified TeamSpace</h1>
            <p className="text-[#64748B] font-medium leading-relaxed">Create your account to get started with your team</p>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
          </div>

          {/* Error Banner */}
          {(error || emailSignUpMutation.error) && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-5 mb-8 shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{error || emailSignUpMutation.error?.message}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {emailSignUpMutation.isPending && (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF8800]/20 border-t-[#FF8800] mx-auto" />
                <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 bg-gradient-to-r from-[#FF8800]/10 to-[#00C4AB]/10 mx-auto" />
              </div>
              <p className="text-[#475569] font-semibold text-lg">Creating your account...</p>
              <p className="text-[#64748B] text-sm mt-2">This will just take a moment</p>
            </div>
          )}

          {/* Auth Form */}
          {!emailSignUpMutation.isPending && (
            <form onSubmit={handleEmailSignUp} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full px-5 py-4 border-2 border-[#E5E7EB] rounded-2xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-lg"
                  required
                />
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-5 py-4 border-2 border-[#E5E7EB] rounded-2xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-lg"
                  required
                />
              </div>

              {/* Email Input */}
              <div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-5 py-4 border-2 border-[#E5E7EB] rounded-2xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-lg"
                  required
                />
              </div>

              {/* Password Fields */}
              <div className="space-y-4">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 8 characters)"
                  className="w-full px-5 py-4 border-2 border-[#E5E7EB] rounded-2xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-lg"
                  required
                  minLength={8}
                />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-5 py-4 border-2 border-[#E5E7EB] rounded-2xl focus:ring-4 focus:ring-[#00C4AB]/25 focus:border-[#00C4AB] transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-lg"
                  required
                />
              </div>

              {/* Continue Button */}
              <Button
                type="submit"
                className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold py-5 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#0F172A]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                disabled={!email || !password || !confirmPassword || !firstName || !lastName || password !== confirmPassword || password.length < 8 || emailSignUpMutation.isPending}
              >
                Continue
              </Button>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-[#64748B]">
                  Already have an account?{" "}
                  <span
                    onClick={() => router.push(routes.login())}
                    className="text-[#00C4AB] hover:text-[#00B3A0] font-bold cursor-pointer transition-colors duration-200 hover:underline"
                  >
                    Sign in
                  </span>
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center my-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent"></div>
                <span className="px-4 text-[#64748B] font-medium">OR</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent"></div>
              </div>

              {/* Social Login Options */}
              <div className="space-y-4">
                <Button
                  onClick={handleGoogleSignUp}
                  variant="outline-primary"
                  className="w-full bg-white/80 backdrop-blur-sm hover:bg-white text-[#374151] hover:text-[#0F172A] font-semibold py-4 px-8 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#D1D5DB] transition-all duration-300 flex items-center justify-center space-x-3 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </Button>
              </div>
            </form>
          )}

          {/* Terms */}
          {!emailSignUpMutation.isPending && (
            <div className="text-center pt-8 border-t border-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mt-8">
              <p className="text-sm text-[#64748B] leading-relaxed">
                By creating an account, you agree to our{" "}
                <span className="text-[#00C4AB] hover:text-[#00B3A0] font-semibold hover:underline cursor-pointer transition-colors">Terms of Service</span> and{" "}
                <span className="text-[#00C4AB] hover:text-[#00B3A0] font-semibold hover:underline cursor-pointer transition-colors">Privacy Policy</span>.
              </p>
            </div>
          )}
        </Card>
      </div>
      </div>
    </PublicOnlyRoute>
  );
}
