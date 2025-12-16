import { Metadata } from "next";

//styles
import "../styles/globals.css";
import { AppProvider } from "./provider";

export const metadata: Metadata = {
  title: "Unified TeamSpace - PM",
  description: "Unified TeamSpace PM Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div id="context-menu-portal" />
        <div id="editor-portal" />
        <AppProvider>
          <div className="h-screen w-full overflow-hidden bg-custom-background-100 relative flex flex-col">
            <main className="w-full h-full overflow-hidden relative">{children}</main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
