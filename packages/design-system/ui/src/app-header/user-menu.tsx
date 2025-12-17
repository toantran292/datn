"use client";

import React, { useState, useRef } from "react";
import { User, LogOut, Settings, Bell, ChevronDown } from "lucide-react";
import { useOutsideClickDetector } from "@uts/hooks";
import type { UserMenuProps } from "./types";
import { cn } from "../utils";
import { useUserProfile } from "./hooks/use-workspaces";

interface UserMenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  className?: string;
}

const UserMenuItem: React.FC<UserMenuItemProps> = ({ icon: Icon, label, onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-3 py-2 text-sm text-left hover:bg-custom-background-80 transition-colors rounded-md",
      className
    )}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);

export const UserMenu: React.FC<UserMenuProps> = ({ className, apiBaseUrl, authWebUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user profile for avatar
  const { data: profile } = useUserProfile({ apiBaseUrl });

  useOutsideClickDetector(menuRef, () => setIsOpen(false));

  const handleLogout = async () => {
    try {
      // Call logout API to invalidate JWT token
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.href = `${authWebUrl}/login`;
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = `${authWebUrl}/login`;
    }
  };

  const handleSettings = () => {
    // Navigate to auth-web account settings page
    window.location.href = `${authWebUrl}/account`;
  };

  // Get display name or email initial for fallback
  const displayName = profile?.displayName || profile?.first_name || profile?.email || "";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-custom-background-80 transition-colors"
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-custom-background-80 flex items-center justify-center overflow-hidden">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : avatarInitial ? (
            <span className="text-sm font-medium text-custom-text-200">{avatarInitial}</span>
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5 hidden md:inline" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-custom-background-100 border border-custom-border-300 rounded-md shadow-custom-shadow-rg py-2 z-20">
          {/* User info section */}
          {profile && (
            <>
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-custom-text-100 truncate">
                  {profile.displayName || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"}
                </p>
                <p className="text-xs text-custom-text-300 truncate">{profile.email}</p>
              </div>
              <div className="my-1 h-px bg-custom-border-200" />
            </>
          )}
          <UserMenuItem icon={Bell} label="Preferences" onClick={() => window.location.href = "/settings/user"} />
          <UserMenuItem icon={Settings} label="Account Settings" onClick={handleSettings} />
          <div className="my-1 h-px bg-custom-border-200" />
          <UserMenuItem
            icon={LogOut}
            label="Logout"
            onClick={handleLogout}
            className="text-red-500 hover:bg-red-500/10"
          />
        </div>
      )}
    </div>
  );
};
