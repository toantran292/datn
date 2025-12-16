"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SettingsView } from "@/features/settings";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function SettingsRoute() {
  const router = useRouter();
  const { hasAdminAccess, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !hasAdminAccess) {
      router.replace("/");
    }
  }, [isLoading, hasAdminAccess, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary/20 border-t-secondary mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return null;
  }

  return <SettingsView />;
}
