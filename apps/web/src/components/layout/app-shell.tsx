"use client";

import * as React from "react";
import { cn } from "@nexus/utils";
import { Sidebar } from "./sidebar.tsx";
import { MobileSidebar } from "./mobile-sidebar.tsx";
import { TopNav } from "./top-nav.tsx";
import { CommandPalette } from "./command-palette.tsx";
import { useIsMobile } from "@/hooks/use-media-query.ts";
import type { NavGroup, WorkspaceConfig } from "./nav-types.ts";
import type { UserProfile } from "./user-menu.tsx";

import type { CommandGroup } from "./command-palette.tsx";

export interface AppShellProps {
  children: React.ReactNode;
  navGroups: NavGroup[];
  commandGroups?: CommandGroup[];
  user?: UserProfile;
  workspace?: WorkspaceConfig;
  workspaces?: WorkspaceConfig[];
  onWorkspaceChange?: (id: string) => void;
  onCreateWorkspace?: () => void;
  sidebarFooter?: React.ReactNode;
  topNavBreadcrumb?: React.ReactNode;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
}

export function AppShell({
  children,
  navGroups,
  commandGroups,
  user,
  workspace,
  workspaces,
  onWorkspaceChange,
  onCreateWorkspace,
  sidebarFooter,
  topNavBreadcrumb,
  notificationCount,
  onNotificationsClick,
  onSettingsClick,
}: AppShellProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          groups={navGroups}
          {...(workspace !== undefined ? { workspace } : {})}
          {...(workspaces !== undefined ? { workspaces } : {})}
          {...(onWorkspaceChange !== undefined ? { onWorkspaceChange } : {})}
          {...(onCreateWorkspace !== undefined ? { onCreateWorkspace } : {})}
          {...(sidebarFooter !== undefined ? { footer: sidebarFooter } : {})}
          className="shrink-0"
        />
      )}

      {/* Mobile sidebar overlay */}
      <MobileSidebar
        groups={navGroups}
        {...(workspace !== undefined ? { workspace } : {})}
        {...(workspaces !== undefined ? { workspaces } : {})}
        {...(onWorkspaceChange !== undefined ? { onWorkspaceChange } : {})}
        {...(sidebarFooter !== undefined ? { footer: sidebarFooter } : {})}
      />

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav
          {...(user !== undefined ? { user } : {})}
          {...(notificationCount !== undefined ? { notificationCount } : {})}
          {...(onNotificationsClick !== undefined ? { onNotificationsClick } : {})}
          {...(onSettingsClick !== undefined ? { onSettingsClick } : {})}
          {...(topNavBreadcrumb !== undefined ? { breadcrumb: topNavBreadcrumb } : {})}
        />

        {/* Content area */}
        <main
          id="main-content"
          className={cn(
            "flex flex-1 flex-col overflow-hidden",
            "transition-all duration-300 ease-out"
          )}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Global command palette — rendered outside layout flow */}
      <CommandPalette {...(commandGroups !== undefined ? { groups: commandGroups } : {})} />
    </div>
  );
}
