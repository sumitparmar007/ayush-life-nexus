"use client";

import * as React from "react";

interface SidebarContextValue {
  isCollapsed: boolean;
  isMobile: boolean;
}

const SidebarContext = React.createContext<SidebarContextValue>({
  isCollapsed: false,
  isMobile: false,
});

export function SidebarContextProvider({
  children,
  isCollapsed,
  isMobile,
}: SidebarContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ isCollapsed, isMobile }),
    [isCollapsed, isMobile]
  );
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  return React.useContext(SidebarContext);
}
