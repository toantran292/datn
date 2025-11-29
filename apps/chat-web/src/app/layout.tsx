import type { Metadata } from 'next';
import '../styles/globals.css';
import { AppProvider } from './provider';
import { MainLayout } from './MainLayout';

export const metadata: Metadata = {
  title: 'Unified TeamSpace - Chat',
  description: 'Unified TeamSpace Chat Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {/* <div className="h-screen w-full overflow-hidden bg-custom-background-100 relative flex flex-col">
            <main className="w-full h-full overflow-hidden relative">{children}</main>
          </div> */}
          <MainLayout>{children}</MainLayout>
        </AppProvider>
      </body>
    </html>
  );
}
