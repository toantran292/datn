"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@uts/design-system/ui";

/**
 * Redirect page for /invite?token=xxx -> /invites/[token]
 * This handles the URL format from invitation emails
 */
export default function InviteRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      // Redirect to the proper invite page
      router.replace(`/invites/${token}`);
    }
  }, [token, router]);

  // If no token, show error
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-transparent to-teal-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-red-50 border border-red-200 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-900 mb-2">Invalid Invitation Link</h2>
            <p className="text-red-700 mb-6">
              The invitation link is missing or invalid. Please check your email for the correct link.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full border border-[#00C4AB] text-[#00C4AB] hover:bg-teal-50 font-medium py-3 px-6 rounded-xl transition-all duration-200"
            >
              Go to Login
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-transparent to-teal-50 flex items-center justify-center p-6">
      <Card className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-4 border-[#FF8800] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Loading invitation...</p>
      </Card>
    </div>
  );
}
