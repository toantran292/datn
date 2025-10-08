"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, Card } from "@uts/design-system/ui";
import { apiGet, apiPost } from "@/lib/api";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import type { MeTenants, Org, Invite } from "@/types/identity";

export default function WorkspacesPage() {
  const router = useRouter();
  const [data, setData] = useState<MeTenants | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningInvite, setJoiningInvite] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const tenantsData = await apiGet<MeTenants>(routes.api.meTenants());
      setData(tenantsData);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
      toast.error("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterWorkspace = (orgId: string) => {
    router.push(routes.enter(orgId));
  };

  const handleJoinInvitation = async (token: string) => {
    setJoiningInvite(token);
    try {
      await apiPost(routes.api.acceptInvite(token));
      toast.success("Joined workspace successfully");
      await fetchTenants(); // Refresh data
    } catch (error) {
      console.error("Failed to join workspace:", error);
      toast.error("Failed to join workspace");
    } finally {
      setJoiningInvite(null);
    }
  };

  const handleCreateWorkspace = () => {
    router.push(routes.workspaceCreate());
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-orange-50 text-orange-600";
      case "ADMIN":
        return "bg-blue-50 text-blue-600";
      case "MEMBER":
        return "bg-teal-50 text-[#00C4AB]";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const getWorkspaceIcon = (index: number) => {
    const icons = [
      <svg key="building" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
      </svg>,
      <svg key="rocket" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>,
      <svg key="users" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
      </svg>
    ];
    return icons[index % icons.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8800] mx-auto mb-4" />
          <p className="text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  const hasWorkspaces = data?.joined && data.joined.length > 0;
  const hasInvitations = data?.invites && data.invites.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-12 px-6">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Choose your workspace</h1>
          <p className="text-base text-gray-600">You can join an existing organization or create a new one.</p>
        </header>

        {/* Empty State */}
        {!hasWorkspaces && !hasInvitations && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-teal-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-600 mb-8">You&apos;re not part of any workspace yet.</p>
            <Button
              onClick={handleCreateWorkspace}
              className="bg-[#FF8800] hover:bg-orange-600 text-white font-medium px-8 py-3 rounded-lg"
            >
              Create your first workspace
            </Button>
          </div>
        )}

        {/* Your Workspaces */}
        {hasWorkspaces && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-6">
                Your Workspaces
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data!.joined.map((org: Org, index: number) => (
                <Card
                  key={org.id}
                  className="group bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-[#00C4AB] cursor-pointer"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center mr-3 text-[#00C4AB]">
                      {getWorkspaceIcon(index)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-gray-900">{org.display_name}</h3>
                      <Badge className={`mt-1 px-2 py-1 text-xs font-medium rounded-xl ${getRoleColor(org.role)}`}>
                        {org.role}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleEnterWorkspace(org.id)}
                    className="w-full bg-[#FF8800] hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors duration-200"
                  >
                    Enter workspace
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Invitations */}
        {hasInvitations && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-6">
                Invitations
              </h2>
            </div>

            <div className="space-y-3">
              {data!.invites.map((invite: Invite) => (
                <Card
                  key={invite.token}
                  className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-base text-gray-900">
                      {invite.inviter_email || "Unknown inviter"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Invited you to join {invite.org_name || "an organization"}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleJoinInvitation(invite.token)}
                    disabled={joiningInvite === invite.token}
                    className="bg-[#00C4AB] hover:bg-teal-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 min-w-[44px] min-h-[44px]"
                  >
                    {joiningInvite === invite.token ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
          <footer className="text-center">
            <div className="w-full h-px bg-gray-200 mb-8" />
            <Button
              onClick={handleCreateWorkspace}
              variant="outline-primary"
              className="border-2 border-[#00C4AB] text-[#00C4AB] hover:bg-teal-50 font-medium px-8 py-3 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create a new workspace
            </Button>
          </footer>
        )}
      </main>
    </div>
  );
}
