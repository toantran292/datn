"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "@uts/design-system/ui";
import { apiPost } from "@/lib/api";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import type { EmailAuthRequest } from "@/types/identity";

export default function LoginPage() {
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleGoogleSignIn = () => {
    setLoading(true);
    window.location.href = routes.api.googleOAuth();
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      const authData: EmailAuthRequest = { email, password };
      await apiPost(routes.api.emailAuth(), authData);
      toast.success("Signed in successfully");
      router.push(routes.workspaces());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-2xl border border-gray-100">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unified TeamSpace</h1>
            <p className="text-gray-600 font-medium">Welcome to Unified TeamSpace</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 text-[#FF8800]">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing you in...
              </div>
            </div>
          )}

          {/* Auth Form */}
          {!loading && (
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                className="w-full bg-[#FF8800] hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </Button>

              <Button
                onClick={() => setShowEmailForm(!showEmailForm)}
                variant="outline-primary"
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl border-2 border-gray-200 hover:border-[#00C4AB] transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5 text-[#00C4AB]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>{showEmailForm ? "Hide Email Form" : "Continue with Email"}</span>
              </Button>

              {/* Email Form */}
              {showEmailForm && (
                <form onSubmit={handleEmailSignIn} className="space-y-4 pt-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C4AB] focus:border-[#00C4AB] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C4AB] focus:border-[#00C4AB] transition-colors"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#00C4AB] hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={!email || !password}
                  >
                    Sign In
                  </Button>
                  <div className="text-center">
                    <span className="text-[#00C4AB] hover:text-teal-600 text-sm font-medium cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                </form>
              )}

              {/* Terms */}
              <div className="text-center pt-6 border-t border-gray-100 mt-6">
                <p className="text-xs text-gray-500 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <span className="text-[#00C4AB] hover:underline cursor-pointer">Terms</span> and{" "}
                  <span className="text-[#00C4AB] hover:underline cursor-pointer">Privacy Policy</span>.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Sign Up Prompt */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don&apos;t have an account?{" "}
            <span className="text-[#FF8800] hover:text-orange-600 font-semibold cursor-pointer">
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
