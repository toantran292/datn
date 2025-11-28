"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/lib/routes";
import { ProtectedRoute } from "@/components/auth/route-guard";

const stages = [
  { percent: 25, text: "Loading workspace..." },
  { percent: 50, text: "Syncing preferences..." },
  { percent: 75, text: "Setting permissions..." },
  { percent: 100, text: "Almost ready..." },
];

function EnterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org_id");

  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      router.replace(routes.workspaces());
      return;
    }

    let progressInterval: any;

    // Call switch-org API first
    const switchOrganization = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
        const response = await fetch(`${apiBase}/auth/switch-org`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ org_id: orgId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to switch organization: ${response.status}`);
        }

        // Verify auth is ready before redirecting
        const verifyAndRedirect = async () => {
          try {
            // Quick verification that session is active
            const verifyResponse = await fetch(`${apiBase}/auth/me`, {
              method: "GET",
              credentials: "include",
            });

            if (verifyResponse.ok) {
              // Session verified, safe to redirect
              window.location.href = `http://localhost:3002`;
            } else {
              // Session not ready, wait a bit longer
              setTimeout(() => {
                window.location.href = `http://localhost:3002`;
              }, 500);
            }
          } catch (err) {
            // On error, still redirect (might be network issue)
            window.location.href = `http://localhost:3002`;
          }
        };

        progressInterval = setInterval(() => {
          setCurrentStage((prev) => {
            const nextStage = prev + 1;
            if (nextStage < stages.length) {
              setProgress(stages[nextStage].percent);
              return nextStage;
            } else {
              clearInterval(progressInterval);
              // Verify session before redirect
              setTimeout(() => {
                verifyAndRedirect();
              }, 300);
              return prev;
            }
          });
        }, 750);
      } catch (err) {
        console.error("Failed to switch organization:", err);
        setError(err instanceof Error ? err.message : "Failed to switch organization");
        setTimeout(() => {
          router.replace(routes.workspaces());
        }, 3000);
      }
    };

    switchOrganization();

    // Cleanup interval on unmount
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [orgId, router]);

  const currentStageData = stages[currentStage] || stages[0];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-transparent to-teal-50 flex items-center justify-center min-h-screen overflow-hidden">
      <div className="flex flex-col items-center justify-center text-center px-8 max-w-lg w-full animate-fade-in">
        {/* Logo/Icon */}
        <div className="mb-8 animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Main Heading */}
        <div className="mb-4">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">Preparing your workspace…</h1>
          <p className="text-lg text-gray-600 font-normal">Loading preferences and permissions.</p>
        </div>

        {/* Progress Bar Section */}
        <div className="w-full max-w-md mt-8">
          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00C4AB] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Progress Label */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600 font-medium">{currentStageData.text}</span>
            <span className="text-sm text-gray-600 font-medium">{progress}%</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-transparent to-teal-50 flex items-center justify-center min-h-screen overflow-hidden">
      <div className="flex flex-col items-center justify-center text-center px-8 max-w-lg w-full">
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-xl flex items-center justify-center shadow-lg animate-pulse">
            <svg className="w-8 h-8 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Loading...</h1>
      </div>
    </div>
  );
}

export default function EnterPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}>
        <EnterPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
