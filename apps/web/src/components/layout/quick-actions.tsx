"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@nexus/utils";
import type { LucideIcon } from "lucide-react";

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  onSelect: () => void;
  variant?: "default" | "primary" | "danger";
}

interface QuickActionsMenuProps {
  actions: QuickAction[];
  className?: string;
}

const variantClasses = {
  default: "text-muted-foreground hover:bg-muted hover:text-foreground",
  primary: "text-primary hover:bg-primary/10",
  danger: "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950",
} as const;

export function QuickActionsMenu({ actions, className }: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [isOpen]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close quick actions" : "Quick actions"}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          "bg-primary text-primary-foreground shadow-md",
          "transition-all duration-200 ease-out",
          "hover:bg-indigo-600 hover:shadow-lg",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "active:scale-95",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? <X className="size-5" /> : <Plus className="size-5" />}
      </button>

      {/* Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Quick actions"
          className={cn(
            "absolute bottom-12 right-0 z-50 w-64",
            "rounded-xl border border-border bg-card shadow-modal",
            "animate-slide-in-bottom"
          )}
        >
          <div className="p-1.5">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    action.onSelect();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                    "transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:bg-muted",
                    variantClasses[action.variant ?? "default"]
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none">{action.label}</span>
                    {action.description && (
                      <span className="text-xs text-muted-foreground">{action.description}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
