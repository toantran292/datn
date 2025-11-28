'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import type { ThemeToggleProps } from './types';
import { cn } from '../utils';

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const [theme, setThemeState] = useState<string>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Try to get theme from next-themes if available
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') || 'light';
      setThemeState(storedTheme);

      // Listen for theme changes
      const handleThemeChange = () => {
        const newTheme = localStorage.getItem('theme') || 'light';
        setThemeState(newTheme);
      };

      window.addEventListener('storage', handleThemeChange);
      return () => window.removeEventListener('storage', handleThemeChange);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    // Try to use next-themes setTheme if available
    if (typeof window !== 'undefined' && (window as any).__theme_setter) {
      (window as any).__theme_setter(newTheme);
    } else {
      // Fallback: manual theme switching
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
      setThemeState(newTheme);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className={cn('w-9 h-9', className)} />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-md hover:bg-custom-background-80 transition-colors',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};
