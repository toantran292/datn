"use client";

import React, { useState, useRef } from "react";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import { useOutsideClickDetector } from "@uts/hooks";
import type { UserMenuProps } from "./types";
import { cn } from "../utils";

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

export const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(menuRef, () => setIsOpen(false));

  const handleLogout = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:40000";

    try {
      await fetch(`${apiBase}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSettings = () => {
    // Navigate to settings page
    window.location.href = "/settings";
  };

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-custom-background-80 transition-colors"
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-custom-background-80 flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
        <ChevronDown className="h-3.5 w-3.5 hidden md:inline" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-custom-background-100 border border-custom-border-300 rounded-md shadow-custom-shadow-rg py-2 z-20">
          <UserMenuItem icon={Settings} label="Settings" onClick={handleSettings} />
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
