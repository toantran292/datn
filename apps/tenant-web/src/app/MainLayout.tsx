"use client";

import { ReactNode, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppHeader } from "@uts/design-system/ui";
import {
  Users,
  LayoutDashboard,
  FolderOpen,
  FolderKanban,
  Settings,
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
  { title: "Projects", icon: FolderKanban, href: "/projects" },
  { title: "Members", icon: Users, href: "/members", requiredAccess: "admin" },
  { title: "Files", icon: FolderOpen, href: "/files" },
  { title: "Settings", icon: Settings, href: "/settings", requiredAccess: "admin" },
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
          <SidebarContent className="pt-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={`px-3 py-2.5 rounded-md cursor-pointer relative transition-colors ${
                            active
                              ? "bg-[#00C4AB]/10 text-[#00C4AB] font-medium"
                              : "hover:bg-muted"
                          }`}
                        >
                          <Link href={item.href}>
                            {active && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00C4AB] rounded-r-full" />
                            )}
                            <item.icon size={20} className={active ? "text-[#00C4AB]" : ""} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
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
