"use client";

import * as React from "react";
import { Menu, Search, Bell, Settings } from "lucide-react";
import { cn } from "@nexus/utils";
import { useSidebarStore } from "@/store/sidebar.ts";
import { useCommandStore } from "@/store/command.ts";
import { ThemeSwitcher } from "@/components/theme/theme-switcher.tsx";
import { UserMenu } from "./user-menu.tsx";
import type { UserProfile } from "./user-menu.tsx";

interface TopNavProps {
  user?: UserProfile;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function TopNav({
  user,
  notificationCount = 0,
  onNotificationsClick,
  onSettingsClick,
  breadcrumb,
  className,
}: TopNavProps) {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const openCommand = useCommandStore((s) => s.open);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 px-4",
        "border-b border-border bg-card/80 backdrop-blur-md",
        className
      )}
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className={cn(
          "rounded-lg p-2 text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "lg:hidden"
        )}
      >
        <Menu className="size-5" />
      </button>

      {/* Breadcrumb or title */}
      <div className="flex flex-1 items-center overflow-hidden">
        {breadcrumb ? (
          <div className="truncate">{breadcrumb}</div>
        ) : null}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Search trigger — shows keyboard shortcut hint */}
        <button
          type="button"
          onClick={openCommand}
          aria-label="Search (⌘K)"
          className={cn(
            "hidden sm:flex items-center gap-2 rounded-lg border border-border px-3 py-1.5",
            "text-sm text-muted-foreground bg-muted/60",
            "transition-colors duration-150 hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Search className="size-3.5" />
          <span className="hidden md:block text-xs">Search…</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Mobile search icon only */}
        <button
          type="button"
          onClick={openCommand}
          aria-label="Search"
          className={cn(
            "sm:hidden rounded-lg p-2 text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Search className="size-5" />
        </button>

        {/* Notifications */}
        {onNotificationsClick && (
          <button
            type="button"
            onClick={onNotificationsClick}
            aria-label={
              notificationCount > 0
                ? `${notificationCount} notifications`
                : "Notifications"
            }
            className={cn(
              "relative rounded-lg p-2 text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <Bell className="size-5" />
            {notificationCount > 0 && (
              <span
                className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                aria-hidden="true"
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
        )}

        {/* Theme switcher */}
        <ThemeSwitcher compact />

        {/* Settings shortcut */}
        <button
          type="button"
          onClick={onSettingsClick ?? (() => { window.location.href = "/settings"; })}
          aria-label="Settings"
          className={cn(
            "hidden lg:flex rounded-lg p-2 text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Settings className="size-5" />
        </button>

        {/* User menu */}
        {user && <UserMenu user={user} />}
      </div>
    </header>
  );
}
