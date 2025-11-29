"use client";

import { FC, ReactNode } from "react";
import { useTheme } from "next-themes";
import { AppHeaderProvider, Toast } from "@uts/design-system/ui";
import { resolveGeneralTheme } from "@uts/fe-utils";
import { useRouter } from "next/navigation";
import { ChatProvider } from "../contexts/ChatContext";


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
      <AppHeaderProvider currentApp="chat" navigateTo={(path: string) => router.push(path)}>
        <ChatProvider>
          <ToastWithTheme />
          {children}
        </ChatProvider>
      </AppHeaderProvider>
    </>
  );
};
