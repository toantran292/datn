'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@uts/design-system/ui';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workspaces', href: '/workspaces', icon: Building2 },
  { name: 'Users', href: '/users', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-700">
        <Shield className="h-8 w-8 text-blue-400" />
        <span className="text-xl font-bold">Admin Portal</span>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">
          Super Admin Portal v1.0
        </p>
      </div>
    </aside>
  );
}
