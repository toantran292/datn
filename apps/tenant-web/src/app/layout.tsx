import type { Metadata } from 'next';
import '../styles/globals.css';
import { AppProvider } from './provider';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Unified TeamSpace - Tenant Management',
  description: 'Unified TeamSpace Tenant Management Dashboard',
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
          {children}
          <Toaster position="top-right" richColors />
        </AppProvider>
      </body>
    </html>
  );
}
