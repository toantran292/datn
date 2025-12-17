'use client';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col h-screen w-full overflow-hidden">
      <div className="relative flex h-full w-full overflow-hidden">
        <main className="relative flex flex-1 w-full flex-col overflow-hidden" style={{ backgroundColor: 'var(--ts-bg-dark)' }}>
          <div className="flex-1 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
