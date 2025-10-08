"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@uts/design-system/ui";
import { apiPost } from "@/lib/api";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";

interface InvitePageProps {
  params: {
    token: string;
  };
}

export default function InviteAcceptPage({ params }: InvitePageProps) {
  const router = useRouter();
  const { token } = params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock invite data - in real implementation, you might fetch this from the API
  const inviteData = {
    orgName: "TechCorp Inc.",
    memberType: "Senior Developer",
    inviterEmail: "sarah.johnson@techcorp.com"
  };

  const handleAcceptInvitation = async () => {
    setLoading(true);
    setError(null);

    try {
      await apiPost(routes.api.acceptInvite(token));

      toast.success("Invitation accepted successfully!");

      // Show success message briefly then redirect
      setTimeout(() => {
        router.push(routes.workspaces());
      }, 2000);
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to accept invitation";

      // Check if it's a 4xx error (invalid/expired invitation)
      if (errorMessage.includes("400") || errorMessage.includes("404") || errorMessage.includes("expired")) {
        setError("This invitation is no longer valid or has expired.");
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    router.push(routes.workspaces());
  };

  const handleReturnToWorkspaces = () => {
    router.push(routes.workspaces());
  };

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
              This invitation link has expired or is no longer valid. Please contact the organization administrator for a new invitation.
            </p>

            <Button
              onClick={handleReturnToWorkspaces}
              variant="outline-primary"
              className="w-full border border-[#00C4AB] text-[#00C4AB] hover:bg-teal-50 font-medium py-3 px-6 rounded-xl transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Return to Workspace Selection
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
            Join {inviteData.orgName}
          </h1>
          <p className="text-gray-600 leading-relaxed">
            You&apos;ve been invited as{" "}
            <span className="font-medium text-gray-900">{inviteData.memberType}</span> by{" "}
            <span className="font-medium text-[#FF8800]">{inviteData.inviterEmail}</span>
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
            onClick={handleDecline}
            disabled={loading}
            variant="outline-primary"
            className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00C4AB] focus:ring-opacity-40 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
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
