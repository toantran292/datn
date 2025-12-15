"use client";

import { FC, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { resolveGeneralTheme } from "@uts/fe-utils";
import { AppHeaderProvider, Toast } from "@uts/design-system/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppHeaderProvider currentApp="tenant-web" navigateTo={(path: string) => router.push(path)}>
        <ToastWithTheme />
        {children}
      </AppHeaderProvider>
    </QueryClientProvider>
  );
};
