"use client";

import { ReactNode, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppHeader } from "@uts/design-system/ui";
import {
  Users,
  LayoutDashboard,
  FolderOpen,
  ChevronRight,
  LucideIcon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarHeader
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface MainLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  title: string;
  icon: LucideIcon;
  href: string;
  requiredAccess?: "admin"; // admin means OWNER or ADMIN
}

const allMenuItems: MenuItem[] = [
  { title: "Overview", icon: LayoutDashboard, href: "/" },
  { title: "Members", icon: Users, href: "/members", requiredAccess: "admin" },
  { title: "Files", icon: FolderOpen, href: "/files" },
];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const { hasAdminAccess } = useCurrentUser();

  // Filter menu items based on user role
  const menuItems = useMemo(() => {
    return allMenuItems.filter((item) => {
      if (item.requiredAccess === "admin") {
        return hasAdminAccess;
      }
      return true;
    });
  }, [hasAdminAccess]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header - full width at top */}
      <AppHeader className="flex-shrink-0" />

      {/* Sidebar + Content below header */}
      <SidebarProvider className="flex-1 !min-h-0">
        <Sidebar collapsible="none" className="border-r border-border">
          <SidebarHeader className="px-4 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
                <span className="text-white font-semibold text-lg">UT</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-base truncate">Unified TeamSpace</h2>
                <p className="text-xs text-muted-foreground">Enterprise Plan</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        className="px-3 py-2.5 rounded-xl cursor-pointer relative"
                      >
                        <Link href={item.href}>
                          {isActive(item.href) && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-secondary rounded-r-full" />
                          )}
                          <item.icon size={20} />
                          <span>{item.title}</span>
                          {isActive(item.href) && (
                            <ChevronRight className="ml-auto" size={16} />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
