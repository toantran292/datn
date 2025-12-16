import type { ReactNode } from 'react';

export interface ChatLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  details?: ReactNode;
}

export function ChatLayout({ sidebar, main, details }: ChatLayoutProps) {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {sidebar}
      {main}
      {details}
    </div>
  );
}
