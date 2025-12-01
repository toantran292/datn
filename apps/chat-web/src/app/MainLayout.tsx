"use client";

import { AppHeader, useAppHeaderContext } from "@uts/design-system/ui";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { authLoading } = useAppHeaderContext();

  if (authLoading) {
    return (
      <div className="relative flex flex-col h-screen w-full overflow-hidden rounded-lg border border-custom-border-200">
        <AppHeader className="z-[9999]" />
        <div className="relative flex h-full w-full overflow-hidden">
          <div className="flex h-full w-full items-center justify-center bg-custom-background-100">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />
              <p className="text-gray-600 font-medium">Authenticating...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen w-full overflow-hidden rounded-lg border border-custom-border-200">
      <AppHeader className="z-[9999]" />
      <div className="relative flex h-full w-full overflow-hidden">
        <main className="relative flex flex-1 w-full flex-col overflow-hidden bg-custom-background-100">
          <div className="flex-1 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}