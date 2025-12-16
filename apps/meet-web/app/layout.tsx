import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { MainLayout } from "./MainLayout";

export const metadata: Metadata = {
  title: "UTS Meet",
  description: "Unified TeamSpace Meeting Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Script
          src="/lib-jitsi-meet.min.js"
          strategy="beforeInteractive"
        />
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
