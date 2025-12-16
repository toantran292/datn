"use client";

import { FC, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { resolveGeneralTheme } from "@uts/fe-utils";
import { AppHeaderProvider, Toast } from "@uts/design-system/ui";
import { ChatProvider } from "../contexts/ChatContext";

// Environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
const AUTH_WEB_URL = process.env.NEXT_PUBLIC_AUTH_WEB_URL || "http://localhost:3000";
const TENANT_WEB_URL = process.env.NEXT_PUBLIC_TENANT_WEB_URL || "http://localhost:3001";

export interface IAppProvider {
  children: ReactNode;
}

const ToastWithTheme = () => {
  const { resolvedTheme } = useTheme();
  return <Toast theme={resolveGeneralTheme(resolvedTheme)} />;
};

export const AppProvider: FC<IAppProvider> = (props) => {
  const { children } = props;
  const router = useRouter();

  return (
    <>
      <AppHeaderProvider
        currentApp="chat"
        apiBaseUrl={API_BASE_URL}
        authWebUrl={AUTH_WEB_URL}
        tenantWebUrl={TENANT_WEB_URL}
        navigateTo={(path: string) => router.push(path)}
      >
        <ChatProvider>
          <ToastWithTheme />
          {children}
        </ChatProvider>
      </AppHeaderProvider>
    </>
  );
};
