"use client";

import * as React from "react";
import { User, Settings, LogOut, ChevronDown, Shield } from "lucide-react";
import { cn } from "@nexus/utils";

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

interface UserMenuProps {
  user: UserProfile;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu({ user, onProfile, onSettings, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
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

  const initials = getInitials(user.name);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`User menu for ${user.name}`}
        className={cn(
          "flex items-center gap-2 rounded-xl p-1.5 pr-2.5",
          "transition-colors duration-150 hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {/* Avatar */}
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
            user.avatarUrl
              ? "bg-transparent"
              : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          )}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="size-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </span>

        <span className="hidden text-sm font-medium text-foreground md:block">
          {user.name.split(" ")[0]}
        </span>

        <ChevronDown
          className="hidden size-3.5 text-muted-foreground md:block"
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="User menu"
          className={cn(
            "absolute right-0 top-full z-50 mt-1.5 w-60",
            "rounded-xl border border-border bg-card shadow-dropdown",
            "animate-zoom-in origin-top-right"
          )}
        >
          {/* Profile header */}
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
            <p className="mt-1 text-xs text-muted-foreground truncate">{user.email}</p>
            {user.role && (
              <div className="mt-2 flex items-center gap-1.5">
                <Shield className="size-3 text-indigo-500" />
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {user.role}
                </span>
              </div>
            )}
          </div>

          <div className="mx-3 h-px bg-border" />

          <div className="p-1.5">
            {(user.role === "DOCTOR"
              ? [
                  {
                    label: "Doctor Profile",
                    icon: User,
                    action: onProfile ?? (() => {
                      window.location.href = "/doctor/profile";
                    }),
                  },
                ]
              : [
                  {
                    label: "Profile",
                    icon: User,
                    action: onProfile ?? (() => {
                      window.location.href = "/settings?tab=profile";
                    }),
                  },
                  {
                    label: "Settings",
                    icon: Settings,
                    action: onSettings ?? (() => {
                      window.location.href = "/settings";
                    }),
                  },
                ]
            ).map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={() => {
                  action();
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2",
                  "text-sm text-muted-foreground transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  "focus-visible:outline-none focus-visible:bg-muted focus-visible:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="mx-3 h-px bg-border" />

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setIsOpen(false);
                if (onLogout) {
                  onLogout();
                } else {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                  } finally {
                    window.location.href = "/auth/login";
                  }
                }
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2",
                "text-sm text-rose-600 dark:text-rose-400 transition-colors",
                "hover:bg-rose-50 dark:hover:bg-rose-950",
                "focus-visible:outline-none focus-visible:bg-rose-50 dark:focus-visible:bg-rose-950"
              )}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
