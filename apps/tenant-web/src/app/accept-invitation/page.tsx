"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { AcceptInvitationPage } from "@/components/AcceptInvitationPage";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600">No invitation token provided.</p>
        </div>
      </div>
    );
  }

  return (
    <AcceptInvitationPage
      token={token}
      onSuccess={() => {
        router.push("/");
      }}
    />
  );
}

export default function AcceptInvitationRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-teal-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500/20 border-t-orange-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
