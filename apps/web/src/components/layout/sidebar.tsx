"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@nexus/utils";
import { useSidebarStore } from "@/store/sidebar.ts";
import { SidebarContextProvider } from "./sidebar-context.tsx";
import type { NavGroup, WorkspaceConfig } from "./nav-types.ts";
import { WorkspaceSwitcher } from "./workspace-switcher.tsx";
import { SidebarGroup, SidebarFooter } from "./sidebar-items.tsx";

interface SidebarProps {
  groups: NavGroup[];
  workspace?: WorkspaceConfig;
  workspaces?: WorkspaceConfig[];
  onWorkspaceChange?: (id: string) => void;
  onCreateWorkspace?: () => void;
  footer?: React.ReactNode;
  className?: string;
}

export function Sidebar({
  groups,
  workspace,
  workspaces = [],
  onWorkspaceChange,
  onCreateWorkspace,
  footer,
  className,
}: SidebarProps) {
  const { isCollapsed, toggleCollapsed, activeItemId } = useSidebarStore();

  return (
    <SidebarContextProvider isCollapsed={isCollapsed} isMobile={false}>
      <aside
        className={cn(
          "relative flex h-full flex-col border-r border-border bg-card",
          "transition-[width] duration-300 ease-out",
          "overflow-hidden",
          isCollapsed ? "w-[72px]" : "w-64",
          className
        )}
        aria-label="Main navigation"
      >
        {/* Workspace Switcher */}
        {workspace && workspaces.length > 0 && onWorkspaceChange ? (
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspaceId={workspace.id}
            onWorkspaceChange={onWorkspaceChange}
            {...(onCreateWorkspace ? { onCreateWorkspace } : {})}
          />
        ) : workspace ? (
          <div className="px-3 py-2">
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-xl p-2",
                isCollapsed && "justify-center"
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
                {workspace.initials}
              </span>
              {!isCollapsed && (
                <span className="truncate text-sm font-semibold text-foreground">
                  {workspace.name}
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Divider */}
        {workspace && <div className="mx-3 h-px bg-border" />}

        {/* Nav groups */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
          {groups.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              activeItemId={activeItemId}
            />
          ))}
        </nav>

        {/* Footer */}
        {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute bottom-16 -right-3 z-10",
            "flex size-6 items-center justify-center rounded-full",
            "border border-border bg-card shadow-md text-muted-foreground",
            "transition-colors duration-150 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          {isCollapsed ? (
            <PanelLeft className="size-3.5" />
          ) : (
            <PanelLeftClose className="size-3.5" />
          )}
        </button>
      </aside>
    </SidebarContextProvider>
  );
}
