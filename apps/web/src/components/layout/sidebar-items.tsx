"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@nexus/utils";
import { useSidebarContext } from "./sidebar-context.tsx";
import type { NavGroup, NavItem } from "./nav-types.ts";

// ─── SidebarItem ─────────────────────────────────────────────────────────────

interface SidebarItemProps {
  item: NavItem;
  isActive?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ item, isActive, onClick }: SidebarItemProps) {
  const { isCollapsed } = useSidebarContext();
  const Icon = item.icon;

  const base = cn(
    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5",
    "text-sm font-medium transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive
      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
      : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800",
    isCollapsed && "justify-center px-2.5"
  );

  const content = (
    <>
      <Icon
        className={cn(
          "size-5 shrink-0 transition-colors duration-150",
          isActive ? "text-indigo-600 dark:text-indigo-400" : "text-current"
        )}
        aria-hidden={!isCollapsed}
        aria-label={isCollapsed ? item.label : undefined}
      />

      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && (
            <span
              className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                isActive
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                  : "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}

      {/* Collapsed tooltip */}
      {isCollapsed && (
        <span
          className={cn(
            "absolute left-full ml-3 hidden whitespace-nowrap rounded-lg px-2.5 py-1.5",
            "text-xs font-medium text-neutral-50 bg-neutral-950 dark:bg-neutral-50 dark:text-neutral-950",
            "shadow-lg opacity-0 transition-opacity duration-150 pointer-events-none",
            "group-hover:opacity-100 lg:block"
          )}
          role="tooltip"
        >
          {item.label}
          {item.badge !== undefined && (
            <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
              {item.badge}
            </span>
          )}
        </span>
      )}
    </>
  );

  if (item.isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
        aria-current={isActive ? "page" : undefined}
        {...(onClick !== undefined ? { onClick } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={base}
      aria-current={isActive ? "page" : undefined}
      {...(onClick !== undefined ? { onClick } : {})}
    >
      {content}
    </Link>
  );
}

// ─── SidebarGroup ─────────────────────────────────────────────────────────────

interface SidebarGroupProps {
  group: NavGroup;
  activeItemId?: string | null;
  onItemClick?: () => void;
}

export function SidebarGroup({ group, activeItemId, onItemClick }: SidebarGroupProps) {
  const { isCollapsed } = useSidebarContext();

  return (
    <div className="flex flex-col gap-0.5">
      {group.label && !isCollapsed && (
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          {group.label}
        </p>
      )}
      {group.items.map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
          isActive={activeItemId === item.id}
          {...(onItemClick !== undefined ? { onClick: onItemClick } : {})}
        />
      ))}
    </div>
  );
}

// ─── SidebarFooter ────────────────────────────────────────────────────────────

interface SidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "mt-auto border-t border-border px-3 pb-4 pt-3",
        className
      )}
    >
      {children}
    </div>
  );
}
