'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  FileVideo,
  Settings,
  FileText,
  Shield,
  Menu,
  X,
  ChevronLeft,
  LogOut,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Active Meetings',
    href: '/admin/meetings',
    icon: <Video className="w-5 h-5" />,
  },
  {
    label: 'Recordings',
    href: '/admin/recordings',
    icon: <FileVideo className="w-5 h-5" />,
  },
  {
    label: 'System Logs',
    href: '/admin/logs',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Mobile Header */}
      <header className="lg:hidden bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ts-orange to-ts-teal flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Admin</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="px-4 py-4 border-t border-gray-700 bg-gray-800/95">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-ts-orange/20 to-ts-teal/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            <div className="border-t border-gray-700 mt-4 pt-4">
              <button
                onClick={() => router.push('/join')}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl"
              >
                <LogOut className="w-5 h-5" />
                <span>Exit Admin</span>
              </button>
            </div>
          </nav>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-gray-800/50 backdrop-blur-sm border-r border-gray-700 z-40 transition-all duration-300 ${
            isSidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ts-orange to-ts-teal flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {isSidebarOpen && (
                <div>
                  <h1 className="font-bold text-white">System Admin</h1>
                  <p className="text-xs text-gray-500">UTS Meet</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-ts-orange/20 to-ts-teal/20 text-white border border-ts-orange/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <span className={isActive(item.href) ? 'text-ts-orange' : ''}>
                      {item.icon}
                    </span>
                    {isSidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}
                    {isSidebarOpen && item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-ts-orange/20 text-ts-orange rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => router.push('/join')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-colors ${
                !isSidebarOpen ? 'justify-center' : ''
              }`}
              title={!isSidebarOpen ? 'Exit Admin' : undefined}
            >
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span>Exit Admin</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 min-h-screen transition-all duration-300 ${
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
