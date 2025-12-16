"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(routes.accountProfile());
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF8800] border-t-transparent" />
    </div>
  );
}
