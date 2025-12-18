"use client";

import { FC, ReactNode } from "react";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { useTheme } from "next-themes";
import { SWRConfig } from "swr";
import { WEB_SWR_CONFIG } from "@uts/constants";
import { AppHeaderProvider, Toast } from "@uts/design-system/ui";

import { resolveGeneralTheme } from "@uts/fe-utils";
import { useRouter, useParams } from "next/navigation";


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
  const params = useParams();

  // Extract workspaceSlug from URL params
  const workspaceSlug = Array.isArray(params?.workspaceSlug)
    ? params.workspaceSlug[0]
    : params?.workspaceSlug;

  return (
    <>
      <AppHeaderProvider
        currentApp="pm"
        workspaceSlug={workspaceSlug}
        navigateTo={(path: string) => router.push(path)}
      >
        <ProgressProvider
          height="4px"
          color="rgb(var(--color-primary-100))"
          options={{ showSpinner: false }}
          shallowRouting
        >
          <ToastWithTheme />
          <SWRConfig value={WEB_SWR_CONFIG}>{children}</SWRConfig>
        </ProgressProvider>
      </AppHeaderProvider>
    </>
  );
};
