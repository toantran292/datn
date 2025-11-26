import React from "react";
import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import {
  Users,
  FolderKanban,
  HardDrive,
  Crown,
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  Plug,
  Settings,
  ChevronRight
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
} from "./ui/sidebar";

interface User {
  user_id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  user: User;
}

const menuItems = [
  { title: "Overview", icon: LayoutDashboard, page: "overview" },
  { title: "Members", icon: Users, page: "members" },
  // { title: "Projects", icon: FolderKanban, page: "projects" },
  { title: "Billing", icon: CreditCard, page: "billing" },
  { title: "Files", icon: FolderOpen, page: "files" },
  // { title: "Integrations", icon: Plug, page: "integrations" },
  // { title: "Settings", icon: Settings, page: "settings" }
];

export function DashboardLayout({ children, currentPage, onNavigate, user }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar className="border-r border-border">
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
                        isActive={currentPage === item.page}
                        className="px-3 py-2.5 rounded-xl cursor-pointer relative"
                        onClick={() => onNavigate(item.page)}
                      >
                        {currentPage === item.page && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-secondary rounded-r-full" />
                        )}
                        <item.icon size={20} />
                        <span>{item.title}</span>
                        {currentPage === item.page && (
                          <ChevronRight className="ml-auto" size={16} />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar user={user} />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
