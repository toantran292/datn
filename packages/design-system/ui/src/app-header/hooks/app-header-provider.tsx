 "use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
 import { QueryClient, QueryClientProvider, type QueryClientConfig } from "@tanstack/react-query";
 // `next-themes` là optional peer đối với một số môi trường (storybook, không phải Next),
 // nên import động để tránh lỗi type ở môi trường không có module.
 // Ở runtime Next.js thật, `next-themes` phải có trong deps (đã được khai báo trong package.json).
 import { ThemeProvider, type ThemeProviderProps } from "next-themes";
 import type { TPartialProject } from "@uts/types";
 import type { TAppType } from "../types";
 import type { AuthMeResponse } from "./use-workspaces";
 import { useAuthMe } from "./use-workspaces";

export interface AppHeaderContextValue {
  // App info
  currentApp: TAppType;
  apiBaseUrl: string;
  authWebUrl: string;
  tenantWebUrl: string;

  // Auth info
  auth: AuthMeResponse | null;
  authLoading: boolean;
  authError: unknown;

  // Workspace / project
  workspaceSlug?: string;
  currentWorkspaceId?: string;
  setCurrentWorkspaceId: (workspaceId?: string) => void;

  currentProjectId?: string;
  currentProject: TPartialProject | null;

  /**
   * Hàm tiện ích để nhận `project` từ `AppHeader.onProjectChange`
   * và đồng bộ lại cả `currentProject` lẫn `currentProjectId`.
   * - `project = null` nghĩa là không thuộc project nào.
   */
  setProjectFromHeader: (project: TPartialProject | null) => void;

  /**
   * Hàm điều hướng optional do app cung cấp (vd: Next.js router.push).
   * Nếu không có, provider sẽ fallback sang window.location.href.
   */
  navigateTo?: (path: string) => void;
}

 const AppHeaderContext = createContext<AppHeaderContextValue | undefined>(undefined);

 export interface AppHeaderProviderProps {
   children: React.ReactNode;

   // App & routing context
   currentApp: TAppType;
   workspaceSlug?: string;

   // API / Auth URLs
   apiBaseUrl?: string;
   authWebUrl?: string;
   tenantWebUrl?: string;
   pmWebUrl?: string;
   chatWebUrl?: string;

   // Initial selection
   initialWorkspaceId?: string;
   initialProjectId?: string;

   // React Query config (optional)
   queryClient?: QueryClient;
   queryClientConfig?: QueryClientConfig;

   // Theme provider config (optional)
   themeProps?: Omit<ThemeProviderProps, "children">;
  /**
   * Hàm điều hướng optional (vd: Next.js router.push).
   * Nếu truyền vào, provider sẽ dùng hàm này thay vì window.location.href.
   */
  navigateTo?: (path: string) => void;
 }

 const DEFAULT_THEME_PROPS: Omit<ThemeProviderProps, "children"> = {
   themes: ["light", "dark", "light-contrast", "dark-contrast", "custom"],
   defaultTheme: "light",
 };

 const AppHeaderContextProvider: React.FC<
   Omit<AppHeaderProviderProps, "queryClient" | "queryClientConfig" | "themeProps">
 > = ({
   children,
   currentApp,
   workspaceSlug,
   apiBaseUrl,
   authWebUrl,
   tenantWebUrl,
   chatWebUrl,
   pmWebUrl,
   initialWorkspaceId,
   initialProjectId,
  navigateTo,
 }) => {
  const effectiveApiBase = apiBaseUrl || "http://localhost:8080";
  const effectiveAuthWebUrl = authWebUrl || "http://localhost:3000";
  const effectiveTenantWebUrl = tenantWebUrl || "http://localhost:3001";
  const effectiveChatWebUrl = chatWebUrl || "http://localhost:3003";
  const effectivePmWebUrl = pmWebUrl || "http://localhost:3002";

  // workspaceId lấy từ tham số đầu vào (hoặc sau này từ path nếu cần)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>(initialWorkspaceId);
  const [currentProject, setCurrentProject] = useState<TPartialProject | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(initialProjectId);

  // Nếu không truyền initialProjectId, cố gắng đọc từ URL pattern /project/:id
  useEffect(() => {
    if (initialProjectId || typeof window === "undefined") return;
    const match = window.location.pathname.match(/\/project\/([^/]+)/);
    if (match?.[1]) {
      setCurrentProjectId(match[1]);
    }
  }, [initialProjectId]);

  // Auth query (sử dụng React Query)
  const {
    data: auth,
    isLoading: authLoading,
    error: authError,
  } = useAuthMe({ apiBaseUrl: effectiveApiBase });

  // Redirect về AuthWeb khi auth invalid (401)
  useEffect(() => {
    if (!authError) return;

    const err: any = authError;
    const status = err?.status;

    if (status === 401 && typeof window !== "undefined") {
      const currentUrl = window.location.href;
      window.location.href = `${effectiveAuthWebUrl}/login?redirect=${encodeURIComponent(currentUrl)}`;
    }
  }, [authError, effectiveAuthWebUrl]);

  // Auto-sync currentWorkspaceId from auth.org_id when auth data is loaded
  // This ensures presence tracking works correctly across all apps
  useEffect(() => {
    if (auth?.org_id && !currentWorkspaceId) {
      setCurrentWorkspaceId(auth.org_id);
    }
  }, [auth?.org_id, currentWorkspaceId]);

  const value: AppHeaderContextValue = useMemo(
    () => ({
      currentApp,
      apiBaseUrl: effectiveApiBase,
      authWebUrl: effectiveAuthWebUrl,
      tenantWebUrl: effectiveTenantWebUrl,
      chatWebUrl: effectiveChatWebUrl,
      pmWebUrl: effectivePmWebUrl,
      auth: auth ?? null,
      authLoading,
      authError,
      workspaceSlug,
      currentWorkspaceId,
      setCurrentWorkspaceId,
      currentProjectId,
      currentProject,
      setProjectFromHeader: (project: TPartialProject | null) => {
        setCurrentProject(project);
        setCurrentProjectId(project?.id);

        // Điều hướng theo project cho các app Next:
        // - Có project => /project/:id
        // - Không có => "/"
        const targetPath = project ? `/project/${project.id}` : "/";

        // Ưu tiên dùng hàm navigateTo do app cung cấp (vd: Next.js router.push)
        if (navigateTo) {
          navigateTo(targetPath);
          return;
        }

        // Fallback: dùng window.location nếu không có navigateTo (non-Next env)
        if (typeof window !== "undefined") {
          window.location.href = targetPath;
        }
      },
      navigateTo,
    }),
    [
      currentApp,
      effectiveApiBase,
      effectiveAuthWebUrl,
      effectiveTenantWebUrl,
      effectiveChatWebUrl,
      effectivePmWebUrl,
      auth,
      authLoading,
      authError,
      workspaceSlug,
      currentWorkspaceId,
      currentProject,
      currentProjectId,
      navigateTo,
    ],
  );

   return <AppHeaderContext.Provider value={value}>{children}</AppHeaderContext.Provider>;
 };

 export const AppHeaderProvider: React.FC<AppHeaderProviderProps> = (props) => {
   const { children, queryClient, queryClientConfig, themeProps, ...rest } = props;

   const [client] = useState(
     () =>
       queryClient ||
       new QueryClient(
         queryClientConfig || {
           defaultOptions: {
             queries: {
               staleTime: 1000 * 60 * 5,
               retry: 1,
             },
           },
         },
       ),
   );

   const mergedThemeProps = { ...DEFAULT_THEME_PROPS, ...(themeProps || {}) };

   return (
     <QueryClientProvider client={client}>
       <ThemeProvider {...mergedThemeProps}>
         <AppHeaderContextProvider {...rest}>{children}</AppHeaderContextProvider>
       </ThemeProvider>
     </QueryClientProvider>
   );
 };

 export const useAppHeaderContext = (): AppHeaderContextValue => {
   const ctx = useContext(AppHeaderContext);
   if (!ctx) {
     throw new Error("useAppHeaderContext must be used within an AppHeaderProvider");
   }
   return ctx;
 };

