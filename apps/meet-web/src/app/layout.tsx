import type { Metadata } from "next";

import "../styles/globals.css";
import "../styles/index.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Unified TeamSpace - Authentication",
  description: "Sign in to your Unified TeamSpace workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
