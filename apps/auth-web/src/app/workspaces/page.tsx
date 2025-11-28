"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, Card } from "@uts/design-system/ui";
import { routes } from "@/lib/routes";
import { useTenants, useAcceptInvite } from "@/hooks/use-tenants";
import { ProtectedRoute } from "@/components/auth/route-guard";
import type { Org, Invite } from "@/types/identity";

function WorkspacesPageContent() {
  const router = useRouter();
  const { data, isLoading: loading, error } = useTenants();
  const acceptInviteMutation = useAcceptInvite();

  // Check for pending invitation and redirect back to accept page
  useEffect(() => {
    const pendingToken = localStorage.getItem("pending_invitation_token");
    if (pendingToken) {
      router.push(routes.inviteAccept(pendingToken));
    }
  }, [router]);

  const handleEnterWorkspace = (orgId: string) => {
    router.push(routes.enter(orgId));
  };

  const handleJoinInvitation = (token: string) => {
    acceptInviteMutation.mutate(token);
  };

  const handleCreateWorkspace = () => {
    router.push(routes.workspaceCreate());
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-gradient-to-r from-orange-50 to-orange-100 text-[#FF8800] border border-orange-200";
      case "ADMIN":
        return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border border-blue-200";
      case "MEMBER":
        return "bg-gradient-to-r from-teal-50 to-teal-100 text-[#00C4AB] border border-teal-200";
      default:
        return "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 border border-slate-200";
    }
  };

  const getWorkspaceIcon = (index: number) => {
    const icons = [
      <svg key="building" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h12a2 2 0 012 2v16a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3a1 1 0 00-1-1h-2a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm4 2h2v2H8V6zm4 0h2v2h-2V6zM8 10h2v2H8v-2zm4 0h2v2h-2v-2z"
          clipRule="evenodd"
        />
      </svg>,
      <svg key="rocket" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"
          clipRule="evenodd"
        />
      </svg>,
      <svg key="users" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
      </svg>,
    ];
    return icons[index % icons.length];
  };

  // UTS Brand Logo Component
  const UTSLogo = () => (
    <div className="w-12 h-12 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-xl flex items-center justify-center shadow-lg">
      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );

  // Empty State Illustration
  const EmptyStateIllustration = () => (
    <div className="relative flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF8800]/10 to-[#00C4AB]/10 rounded-full blur-3xl scale-150" />
      <div className="relative w-24 h-24 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-2xl flex items-center justify-center shadow-2xl">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF8800]/20 border-t-[#FF8800] mx-auto mb-6" />
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 bg-gradient-to-r from-[#FF8800]/10 to-[#00C4AB]/10 mx-auto" />
          </div>
          <p className="text-[#475569] font-medium text-lg">Loading your workspaces...</p>
          <p className="text-[#64748B] text-sm mt-2">This won&apos;t take long</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-[#475569] font-medium text-lg">Failed to load workspaces</p>
          <p className="text-[#64748B] text-sm mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const hasWorkspaces = data?.joined && data.joined.length > 0;
  const hasInvitations = data?.invites && data.invites.length > 0;

  console.log("data: ", data!.joined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB]">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header - Compact when workspaces exist */}
        <header className={`text-center ${hasWorkspaces || hasInvitations ? "mb-8" : "mb-16"}`}>
          <div className={`flex justify-center ${hasWorkspaces || hasInvitations ? "mb-4" : "mb-8"}`}>
            <UTSLogo />
          </div>
          <h1
            className={`font-bold text-[#0F172A] tracking-tight ${hasWorkspaces || hasInvitations ? "text-2xl mb-2" : "text-3xl mb-4"}`}
          >
            Choose your workspace
          </h1>
          <p
            className={`text-[#64748B] max-w-md mx-auto leading-relaxed ${hasWorkspaces || hasInvitations ? "text-base" : "text-lg"}`}
          >
            You can join an existing organization or create a new one.
          </p>
          {!(hasWorkspaces || hasInvitations) && (
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mt-8 opacity-60" />
          )}
        </header>

        {/* Empty State */}
        {!hasWorkspaces && !hasInvitations && (
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="mb-12">
              <EmptyStateIllustration />
            </div>
            <div className="space-y-6 items-center justify-center flex flex-col">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-3">You&apos;re not part of any workspace yet</h2>
                <p className="text-[#64748B] text-lg leading-relaxed">
                  Create your first workspace to get started with your team collaboration.
                </p>
              </div>
              <Button
                onClick={handleCreateWorkspace}
                className="bg-gradient-to-r from-[#FF8800] to-[#FF7700] hover:from-[#FF7700] hover:to-[#E56600] active:from-[#E56600] active:to-[#CC5500] text-white font-semibold px-10 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#FF8800]/25 text-lg max-w-xs w-full"
              >
                Create your first workspace
              </Button>
            </div>
          </div>
        )}

        {/* Your Workspaces */}
        {hasWorkspaces && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#64748B] mb-3">Your Workspaces</h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-[#FF8800] to-[#00C4AB] rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data!.joined.map((org: Org, index: number) => (
                <Card
                  key={org.id}
                  className="group bg-white/90 backdrop-blur-sm rounded-2xl border border-[#E2E8F0]/80 p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.12)] hover:-translate-y-1 hover:border-[#00C4AB]/50 cursor-pointer hover:bg-white hover:shadow-2xl"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 shadow-sm ${
                          index % 2 === 0
                            ? "bg-gradient-to-br from-[#FFF4E6] to-[#FFE4CC] text-[#FF8800]"
                            : "bg-gradient-to-br from-[#E6FFFB] to-[#CCF7F0] text-[#00C4AB]"
                        }`}
                      >
                        {getWorkspaceIcon(index)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-[#0F172A] mb-2 truncate group-hover:text-[#FF8800] transition-colors leading-tight">
                          {org.display_name}
                        </h3>
                        <Badge className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleColor(org.role)}`}>
                          {org.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <Button
                        onClick={() => handleEnterWorkspace(org.id)}
                        className="w-full bg-gradient-to-r from-[#FF8800] to-[#FF7700] hover:from-[#FF7700] hover:to-[#E56600] active:from-[#E56600] active:to-[#CC5500] text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#FF8800]/25 text-sm"
                      >
                        Enter workspace
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Invitations */}
        {hasInvitations && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#64748B] mb-3">Invitations</h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-[#00C4AB] to-[#FF8800] rounded-full" />
            </div>

            <div className="space-y-3">
              {data!.invites.map((invite: Invite) => (
                <Card
                  key={invite.token}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#E2E8F0]/80 p-5 flex items-center justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.12)] hover:border-[#00C4AB]/40 hover:bg-white hover:shadow-xl"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-[#E6FFFB] to-[#CCF7F0] rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-5 h-5 text-[#00C4AB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base text-[#0F172A] mb-1 truncate">
                        {invite.inviter_email || "Unknown inviter"}
                      </p>
                      <p className="text-[#64748B] text-sm truncate">
                        Invited you to join{" "}
                        <span className="font-semibold text-[#475569]">{invite.org_name || "an organization"}</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleJoinInvitation(invite.token)}
                    disabled={acceptInviteMutation.isPending}
                    className="bg-gradient-to-r from-[#00C4AB] to-[#00B3A0] hover:from-[#00B3A0] hover:to-[#009B8A] active:from-[#009B8A] active:to-[#008374] text-white font-semibold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px] focus:outline-none focus:ring-4 focus:ring-[#00C4AB]/25 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-4 text-sm"
                  >
                    {acceptInviteMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      "Join"
                    )}
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Footer Actions */}
        {(hasWorkspaces || hasInvitations) && (
          <footer className="text-center pt-6">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent mx-auto mb-8" />
            <Button
              onClick={handleCreateWorkspace}
              className="border-2 border-[#00C4AB] text-[#00C4AB] hover:bg-gradient-to-r hover:from-[#E6FFFB] hover:to-[#CCF7F0] hover:border-[#00B3A0] font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#00C4AB]/25 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create a new workspace
            </Button>
          </footer>
        )}
      </main>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4 animate-pulse">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-2">Loading...</h1>
      </div>
    </div>
  );
}

export default function WorkspacesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}>
        <WorkspacesPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
