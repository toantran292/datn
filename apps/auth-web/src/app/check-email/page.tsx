"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@uts/design-system/ui";
import { routes } from "@/lib/routes";
import { useResendVerification } from "@/hooks/use-auth";

function CheckEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [countdown, setCountdown] = useState(0);
  const resendMutation = useResendVerification();

  // UTS Brand Logo Component
  const UTSLogo = () => (
    <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-2xl flex items-center justify-center shadow-xl">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = () => {
    if (!email || countdown > 0) return;

    resendMutation.mutate(email, {
      onSuccess: () => {
        setCountdown(60); // 60 second cooldown
      },
    });
  };

  // Mask email for display (show first 2 chars and domain)
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!domain) return email;
    const maskedLocal = localPart.length > 2
      ? `${localPart.slice(0, 2)}${"*".repeat(Math.min(localPart.length - 2, 5))}`
      : localPart;
    return `${maskedLocal}@${domain}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] px-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-white/20 rounded-3xl">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <UTSLogo />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Check Your Email</h1>
            <p className="text-[#64748B] font-medium leading-relaxed">We&apos;ve sent you a verification link</p>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-4 opacity-60" />
          </div>

          {/* Content */}
          <div className="text-center space-y-8">
            {/* Email Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-[#FF8800]/10 to-[#00C4AB]/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-[#FF8800]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="space-y-4">
              <p className="text-[#475569] text-lg font-semibold">
                Almost there!
              </p>
              <p className="text-[#64748B]">
                We&apos;ve sent a verification email to{" "}
                {email ? (
                  <span className="font-semibold text-[#0F172A]">{maskEmail(email)}</span>
                ) : (
                  "your email address"
                )}
                . Click the link in the email to verify your account.
              </p>
            </div>

            {/* Tips Box */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5 text-left">
              <p className="text-sm font-semibold text-blue-800 mb-3">Can&apos;t find the email?</p>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Check your spam or junk folder
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Make sure you entered the correct email
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Wait a few minutes and try again
                </li>
              </ul>
            </div>

            {/* Resend Button */}
            {email && (
              <Button
                onClick={handleResendEmail}
                disabled={countdown > 0 || resendMutation.isPending}
                className="w-full bg-gradient-to-r from-[#00C4AB] to-[#00B3A0] hover:from-[#00B3A0] hover:to-[#009B8A] active:from-[#009B8A] active:to-[#008374] text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#00C4AB]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {resendMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
            )}

            {/* Back to Sign In */}
            <div className="pt-4 border-t border-[#E2E8F0]">
              <p className="text-[#64748B] mb-4">Already verified your email?</p>
              <Button
                onClick={() => router.push(routes.login())}
                variant="outline-primary"
                className="w-full bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-[#FFF4E6] hover:to-[#FFE4CC] text-[#475569] hover:text-[#FF8800] font-bold py-4 px-8 rounded-2xl border-2 border-[#E2E8F0] hover:border-[#FF8800] transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#FF8800]/25"
              >
                Go to Sign In
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

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckEmailPageContent />
    </Suspense>
  );
}
