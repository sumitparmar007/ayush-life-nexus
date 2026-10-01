"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@nexus/utils";
import { useSidebarStore } from "@/store/sidebar.ts";
import { SidebarContextProvider } from "./sidebar-context.tsx";
import { SidebarGroup, SidebarFooter } from "./sidebar-items.tsx";
import { WorkspaceSwitcher } from "./workspace-switcher.tsx";
import type { NavGroup, WorkspaceConfig } from "./nav-types.ts";

interface MobileSidebarProps {
  groups: NavGroup[];
  workspace?: WorkspaceConfig;
  workspaces?: WorkspaceConfig[];
  onWorkspaceChange?: (id: string) => void;
  footer?: React.ReactNode;
}

export function MobileSidebar({
  groups,
  workspace,
  workspaces = [],
  onWorkspaceChange,
  footer,
}: MobileSidebarProps) {
  const { isMobileOpen, setMobileOpen, activeItemId } = useSidebarStore();

  // Trap body scroll while open
  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  if (!isMobileOpen) return null;

  return (
    <SidebarContextProvider isCollapsed={false} isMobile>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-sm animate-fade-in"
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col",
          "border-r border-border bg-card shadow-modal",
          "animate-slide-in-left"
        )}
        aria-label="Main navigation"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          {workspace && workspaces.length > 0 && onWorkspaceChange ? (
            <div className="flex-1">
              <WorkspaceSwitcher
                workspaces={workspaces}
                activeWorkspaceId={workspace.id}
                onWorkspaceChange={onWorkspaceChange}
              />
            </div>
          ) : workspace ? (
            <span className="px-3 text-sm font-semibold text-foreground">
              {workspace.name}
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="ml-auto rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="h-px bg-border mx-3" />

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
          {groups.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              activeItemId={activeItemId}
              onItemClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
      </aside>
    </SidebarContextProvider>
  );
}
