"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@uts/design-system/ui";
import { routes } from "@/lib/routes";
import { useVerifyEmail } from "@/hooks/use-auth";

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const verifyEmailMutation = useVerifyEmail();

  // UTS Brand Logo Component
  const UTSLogo = () => (
    <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-2xl flex items-center justify-center shadow-xl">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );

  useEffect(() => {
    const verifyToken = searchParams.get('token');
    if (!verifyToken) {
      setVerificationStatus("error");
      return;
    }
    setToken(verifyToken);

    // Automatically verify the email when token is present
    verifyEmailMutation.mutate(verifyToken, {
      onSuccess: () => {
        setVerificationStatus("success");
      },
      onError: () => {
        setVerificationStatus("error");
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Loading State
  if (verifyEmailMutation.isPending || (token && verificationStatus === "pending")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] px-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 backdrop-blur-sm p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-white/20 rounded-3xl">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <UTSLogo />
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Verifying Your Email</h1>
              <p className="text-[#64748B] font-medium leading-relaxed">Please wait while we verify your email address</p>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
            </div>

            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF8800]/20 border-t-[#FF8800] mx-auto" />
                <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 bg-gradient-to-r from-[#FF8800]/10 to-[#00C4AB]/10 mx-auto" />
              </div>
              <p className="text-[#475569] font-semibold text-lg">Verifying...</p>
              <p className="text-[#64748B] text-sm mt-2">This will just take a moment</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Success State
  if (verificationStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] px-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 backdrop-blur-sm p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-white/20 rounded-3xl">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <UTSLogo />
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Email Verified!</h1>
              <p className="text-[#64748B] font-medium leading-relaxed">Your email has been successfully verified</p>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
            </div>

            <div className="text-center space-y-8">
              <div className="w-24 h-24 bg-gradient-to-br from-[#00C4AB]/10 to-[#00C4AB]/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-[#00C4AB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-4">
                <p className="text-[#475569] text-lg font-semibold">
                  Great! Your email is now verified.
                </p>
                <p className="text-[#64748B]">
                  You can now sign in to your Unified TeamSpace account and start collaborating with your team.
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

  // Error State (invalid or expired token)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] px-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-white/20 rounded-3xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <UTSLogo />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Verification Failed</h1>
            <p className="text-[#64748B] font-medium leading-relaxed">We couldn&apos;t verify your email address</p>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
          </div>

          <div className="text-center space-y-8">
            <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <div className="space-y-4">
              <p className="text-[#475569] text-lg font-semibold">
                {!token ? "Missing verification link" : "This verification link is invalid or has expired"}
              </p>
              <p className="text-[#64748B]">
                {!token
                  ? "Please use the link from your verification email."
                  : "The link may have expired or already been used. Please request a new verification email."
                }
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push(routes.login())}
                className="w-full bg-gradient-to-r from-[#FF8800] to-[#FF7700] hover:from-[#FF7700] hover:to-[#E56600] active:from-[#E56600] active:to-[#CC5500] text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#FF8800]/25"
              >
                Go to Sign In
              </Button>

              <Button
                onClick={() => router.push(routes.signUp())}
                variant="outline-primary"
                className="w-full bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-[#E6FFFB] hover:to-[#CCF7F0] text-[#475569] hover:text-[#00C4AB] font-bold py-4 px-8 rounded-2xl border-2 border-[#E2E8F0] hover:border-[#00C4AB] transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#00C4AB]/25"
              >
                Create New Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
