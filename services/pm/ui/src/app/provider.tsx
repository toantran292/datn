"use client";

import { FC, ReactNode } from "react";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import dynamic from "next/dynamic";
import { useTheme, ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
// Plane Imports
import { WEB_SWR_CONFIG } from "@unified-teamspace/constants";
import { Toast } from "@unified-teamspace/ui";
//helpers
import { resolveGeneralTheme } from "@unified-teamspace/fe-utils";
// polyfills
// import "@/lib/polyfills";

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
      <ProgressProvider
        height="4px"
        color="rgb(var(--color-primary-100))"
        options={{ showSpinner: false }}
        shallowRouting
      >
        <ThemeProvider themes={["light", "dark", "light-contrast", "dark-contrast", "custom"]} defaultTheme="system">
          <ToastWithTheme />
          <SWRConfig value={WEB_SWR_CONFIG}>{children}</SWRConfig>
        </ThemeProvider>
      </ProgressProvider>
    </>
  );
};
