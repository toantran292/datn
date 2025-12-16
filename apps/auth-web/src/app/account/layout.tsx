"use client";

import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { useLogout } from "@/hooks/use-auth";
import { routes } from "@/lib/routes";

const accountNavItems = [
  {
    href: routes.accountProfile(),
    label: "Profile",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: routes.accountSecurity(),
    label: "Security",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const logoutMutation = useLogout();

  // UTS Brand Logo Component
  const UTSLogo = () => (
    <div className="w-10 h-10 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-xl flex items-center justify-center shadow-lg">
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#FFF4E6] to-[#E6FFFB]">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#E2E8F0] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo & Title */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(routes.workspaces())}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                >
                  <UTSLogo />
                  <span className="text-lg font-bold text-[#0F172A]">Unified TeamSpace</span>
                </button>
              </div>

              {/* Back to Workspaces */}
              <button
                onClick={() => router.push(routes.workspaces())}
                className="flex items-center space-x-2 text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back to Workspaces</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sticky top-24">
                <h2 className="text-lg font-bold text-[#0F172A] mb-4 px-3">Account Settings</h2>
                <nav className="space-y-1">
                  {accountNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <button
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-[#FF8800]/10 to-[#00C4AB]/10 text-[#FF8800] font-semibold"
                            : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                        }`}
                      >
                        <span className={isActive ? "text-[#FF8800]" : ""}>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Logout Button */}
                <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                  <button
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
