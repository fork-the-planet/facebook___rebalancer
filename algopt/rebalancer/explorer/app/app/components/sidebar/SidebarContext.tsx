'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {IconButton} from '@mui/material';
import {Menu} from 'lucide-react';

const SIDEBAR_WIDTH_EXPANDED = '16rem';
const SIDEBAR_WIDTH_COLLAPSED = '3.5rem';

interface SidebarContextValue {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Read localStorage after hydration. Lazy-initializing isOpen from
  // localStorage would cause a hydration mismatch when the SSR'd value
  // (defaultOpen) disagrees with the browser-stored value.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rebalancer_sidebar_state');
      if (saved !== null) {
        setIsOpen(saved === 'true');
      }
    }
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('rebalancer_sidebar_state', String(next));
      }
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const value = useMemo<SidebarContextValue>(
    () => ({
      isOpen,
      isCollapsed: !isOpen,
      isMobileOpen,
      toggle,
      toggleMobile,
      closeMobile,
    }),
    [isOpen, isMobileOpen, toggle, toggleMobile, closeMobile],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        className="flex min-h-screen w-full"
        style={
          {
            '--sidebar-width': isOpen
              ? SIDEBAR_WIDTH_EXPANDED
              : SIDEBAR_WIDTH_COLLAPSED,
          } as React.CSSProperties
        }>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function SidebarTrigger({className}: {className?: string}) {
  const {toggle, toggleMobile} = useSidebarContext();

  return (
    <>
      <IconButton
        size="small"
        onClick={toggle}
        className={className}
        sx={{display: {xs: 'none', md: 'inline-flex'}}}>
        <Menu className="size-4" />
      </IconButton>
      <IconButton
        size="small"
        onClick={toggleMobile}
        className={className}
        sx={{display: {xs: 'inline-flex', md: 'none'}}}>
        <Menu className="size-4" />
      </IconButton>
    </>
  );
}
