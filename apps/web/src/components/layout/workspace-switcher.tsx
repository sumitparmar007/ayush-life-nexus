"use client";

import * as React from "react";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { cn } from "@nexus/utils";
import { useSidebarContext } from "./sidebar-context.tsx";
import type { WorkspaceConfig } from "./nav-types.ts";

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceConfig[];
  activeWorkspaceId: string;
  onWorkspaceChange: (id: string) => void;
  onCreateWorkspace?: () => void;
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  onCreateWorkspace,
}: WorkspaceSwitcherProps) {
  const { isCollapsed } = useSidebarContext();
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  if (!active) return null;

  const planBadgeColor: Record<WorkspaceConfig["plan"], string> = {
    free: "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400",
    pro: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    enterprise: "bg-saffron-100 text-saffron-700 dark:bg-saffron-950 dark:text-saffron-300",
  };

  return (
    <div ref={ref} className="relative px-3 py-2">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Switch workspace"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl p-2",
          "transition-colors duration-150 hover:bg-neutral-100 dark:hover:bg-neutral-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isCollapsed && "justify-center"
        )}
      >
        {/* Avatar */}
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            "bg-indigo-600 text-white text-sm font-semibold"
          )}
        >
          {active.avatarUrl ? (
            <img
              src={active.avatarUrl}
              alt={active.name}
              className="size-full rounded-lg object-cover"
            />
          ) : (
            active.initials
          )}
        </span>

        {!isCollapsed && (
          <>
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <span className="truncate text-sm font-semibold text-foreground leading-none">
                {active.name}
              </span>
              <span
                className={cn(
                  "mt-1 rounded-full px-1.5 py-0.5 text-xs font-medium capitalize",
                  planBadgeColor[active.plan]
                )}
              >
                {active.plan}
              </span>
            </div>
            <ChevronsUpDown
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Workspaces"
          className={cn(
            "absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden",
            "rounded-xl border border-border bg-card shadow-dropdown",
            "animate-zoom-in"
          )}
        >
          <div className="p-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                role="option"
                aria-selected={ws.id === activeWorkspaceId}
                onClick={() => {
                  onWorkspaceChange(ws.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-sm",
                  "transition-colors duration-100",
                  ws.id === activeWorkspaceId
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-xs font-semibold text-white">
                  {ws.initials}
                </span>
                <span className="flex-1 truncate font-medium">{ws.name}</span>
                {ws.id === activeWorkspaceId && (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          {onCreateWorkspace && (
            <>
              <div className="mx-1 my-0.5 h-px bg-border" />
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    onCreateWorkspace();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-dashed border-border">
                    <Plus className="size-4" aria-hidden="true" />
                  </span>
                  <span className="font-medium">New workspace</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
