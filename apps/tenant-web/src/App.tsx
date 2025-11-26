import { useState, useEffect } from "react";
import { DashboardLayout } from "./components/DashboardLayout";
import { OverviewPage } from "./components/OverviewPage";
import { MembersPage } from "./components/MembersPage";
import { BillingPage } from "./components/BillingPage";
import { FilesPage } from "./components/FilesPage";
import { AcceptInvitationPage } from "./components/AcceptInvitationPage";
import { Toaster } from "./components/ui/sonner";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const [currentPage, setCurrentPage] = useState("members");
  const { user, isLoading, isAuthenticated } = useAuth();
  const [invitationToken, setInvitationToken] = useState<string | null>(null);

  // Check for invitation token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setInvitationToken(token);
    }
  }, []);

  // If there's an invitation token, show the accept invitation page
  if (invitationToken) {
    return (
      <>
        <AcceptInvitationPage
          token={invitationToken}
          onSuccess={() => {
            // Clear token from URL and reload
            window.location.href = window.location.origin;
          }}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500/20 border-t-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, useAuth hook will redirect to login
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return <OverviewPage />;
      case "members":
        return <MembersPage />;
      case "billing":
        return <BillingPage />;
      case "files":
        return <FilesPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <>
      <DashboardLayout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={user}
      >
        {renderPage()}
      </DashboardLayout>
      <Toaster position="top-right" />
    </>
  );
}
