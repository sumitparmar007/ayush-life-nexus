"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info, Bell, Check } from "lucide-react";
import { cn } from "@nexus/utils";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  timestamp: Date;
  isRead?: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead?: () => void;
  onDismiss?: (id: string) => void;
}

const typeConfig = {
  success: { icon: CheckCircle2, color: "text-sage-600 dark:text-sage-400", bg: "bg-sage-100 dark:bg-sage-950" },
  error: { icon: AlertCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-950" },
  warning: { icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950" },
  info: { icon: Info, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-950" },
} as const;

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onDismiss,
}: NotificationsPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={cn(
          "fixed right-4 top-20 z-50 w-full max-w-sm",
          "rounded-2xl border border-border bg-card shadow-modal",
          "animate-slide-in-top"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && onMarkAllRead && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Check className="size-3" />
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[70vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Bell className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-border">
              {notifications.map((notification) => {
                const cfg = typeConfig[notification.type];
                const Icon = cfg.icon;
                return (
                  <li
                    key={notification.id}
                    className={cn(
                      "relative flex gap-3.5 px-5 py-4 transition-colors",
                      !notification.isRead && "bg-primary/[0.03]"
                    )}
                  >
                    {/* Unread dot */}
                    {!notification.isRead && (
                      <span
                        className="absolute left-2 top-5 size-1.5 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    )}

                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                        cfg.bg
                      )}
                    >
                      <Icon className={cn("size-4", cfg.color)} aria-hidden="true" />
                    </span>

                    <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {notification.title}
                      </p>
                      {notification.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {notification.description}
                        </p>
                      )}
                      <time className="mt-1 text-xs text-muted-foreground/60">
                        {formatRelativeTime(notification.timestamp)}
                      </time>
                    </div>

                    {onDismiss && (
                      <button
                        type="button"
                        onClick={() => onDismiss(notification.id)}
                        aria-label="Dismiss notification"
                        className="mt-0.5 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
