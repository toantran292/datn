"use client";

import { FC, ReactNode } from "react";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import dynamic from "next/dynamic";
import { useTheme, ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Plane Imports
import { WEB_SWR_CONFIG } from "@uts/constants";
import { Toast } from "@uts/design-system/ui";
//helpers
import { resolveGeneralTheme } from "@uts/fe-utils";
// polyfills
// import "@/lib/polyfills";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export interface IAppProvider {
  children: ReactNode;
}

const ToastWithTheme = () => {
  const { resolvedTheme } = useTheme();
  return <Toast theme={resolveGeneralTheme(resolvedTheme)} />;
};

export const AppProvider: FC<IAppProvider> = (props) => {
  const { children } = props;
  // themes
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ProgressProvider
          height="4px"
          color="rgb(var(--color-primary-100))"
          options={{ showSpinner: false }}
          shallowRouting
        >
          <ThemeProvider themes={["light", "dark", "light-contrast", "dark-contrast", "custom"]} defaultTheme="light">
            <ToastWithTheme />
            <SWRConfig value={WEB_SWR_CONFIG}>{children}</SWRConfig>
          </ThemeProvider>
        </ProgressProvider>
      </QueryClientProvider>
    </>
  );
};
