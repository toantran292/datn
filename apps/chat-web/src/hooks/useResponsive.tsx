'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

// Breakpoints matching Tailwind defaults
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  sidebarOpen: boolean;
  detailsPanelOpen: boolean;
}

interface ResponsiveContextValue extends ResponsiveState {
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleDetailsPanel: () => void;
  openDetailsPanel: () => void;
  closeDetailsPanel: () => void;
}

const ResponsiveContext = createContext<ResponsiveContextValue | null>(null);

export function ResponsiveProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1280,
        sidebarOpen: true,
        detailsPanelOpen: false,
      };
    }

    const width = window.innerWidth;
    const isMobile = width < BREAKPOINTS.md;
    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
    const isDesktop = width >= BREAKPOINTS.lg;

    return {
      isMobile,
      isTablet,
      isDesktop,
      width,
      sidebarOpen: !isMobile,
      detailsPanelOpen: false,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < BREAKPOINTS.md;
      const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
      const isDesktop = width >= BREAKPOINTS.lg;

      setState((prev) => {
        const shouldCloseSidebar = isMobile && !prev.isMobile;
        const shouldOpenSidebar = !isMobile && prev.isMobile;
        const shouldCloseDetails = isMobile && prev.detailsPanelOpen;

        return {
          isMobile,
          isTablet,
          isDesktop,
          width,
          sidebarOpen: shouldCloseSidebar ? false : shouldOpenSidebar ? true : prev.sidebarOpen,
          detailsPanelOpen: shouldCloseDetails ? false : prev.detailsPanelOpen,
        };
      });
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((prev) => {
      if (prev.isMobile && !prev.sidebarOpen && prev.detailsPanelOpen) {
        return { ...prev, sidebarOpen: true, detailsPanelOpen: false };
      }
      return { ...prev, sidebarOpen: !prev.sidebarOpen };
    });
  }, []);

  const openSidebar = useCallback(() => {
    setState((prev) => {
      if (prev.isMobile && prev.detailsPanelOpen) {
        return { ...prev, sidebarOpen: true, detailsPanelOpen: false };
      }
      return { ...prev, sidebarOpen: true };
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, sidebarOpen: false }));
  }, []);

  const toggleDetailsPanel = useCallback(() => {
    setState((prev) => {
      if (prev.isMobile && !prev.detailsPanelOpen && prev.sidebarOpen) {
        return { ...prev, detailsPanelOpen: true, sidebarOpen: false };
      }
      return { ...prev, detailsPanelOpen: !prev.detailsPanelOpen };
    });
  }, []);

  const openDetailsPanel = useCallback(() => {
    setState((prev) => {
      if (prev.isMobile && prev.sidebarOpen) {
        return { ...prev, detailsPanelOpen: true, sidebarOpen: false };
      }
      return { ...prev, detailsPanelOpen: true };
    });
  }, []);

  const closeDetailsPanel = useCallback(() => {
    setState((prev) => ({ ...prev, detailsPanelOpen: false }));
  }, []);

  const contextValue: ResponsiveContextValue = {
    ...state,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    toggleDetailsPanel,
    openDetailsPanel,
    closeDetailsPanel,
  };

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsive() {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  return context;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

export function useIsTablet() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
}

export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}
