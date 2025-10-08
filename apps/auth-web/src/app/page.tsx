"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.replace(routes.login());
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8800] mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}