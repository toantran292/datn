"use client";

import { FC, useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { LogOut, ChevronDown, User, Sun, Moon } from "lucide-react";
import { cn } from "@uts/fe-utils";
import { useTheme } from "next-themes";

export const AppHeader: FC = observer(() => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      const authWebUrl = process.env.NEXT_PUBLIC_AUTH_WEB_URL || 'http://localhost:3000';
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/pm', '') || 'http://localhost:40000';

      // Call logout API
      await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      // Redirect to auth-web login
      window.location.href = `${authWebUrl}/login`;
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if API call fails
      const authWebUrl = process.env.NEXT_PUBLIC_AUTH_WEB_URL || 'http://localhost:3000';
      window.location.href = `${authWebUrl}/login`;
    }
  };

  return (
    <header className="h-14 border-b border-custom-border-200 bg-custom-background-100 flex items-center justify-between px-4">
      {/* Left side - can add breadcrumbs or title later */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-custom-text-100">Project Management</h1>
      </div>

      {/* Right side - Theme toggle & User menu */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle Button */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-md transition-colors",
              "hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100"
            )}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        )}

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
            "hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100",
            isDropdownOpen && "bg-custom-background-80"
          )}
        >
          <div className="w-6 h-6 rounded-full bg-custom-primary-100 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isDropdownOpen && "rotate-180"
          )} />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-custom-background-100 border border-custom-border-200 py-1 z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-custom-text-200 hover:bg-custom-background-80 hover:text-custom-text-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
});
