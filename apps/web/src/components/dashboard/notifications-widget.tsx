import * as React from "react";
import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";
import { cn } from "@nexus/utils";
import { WidgetContainer, WidgetEmpty } from "./widget-container.tsx";
import type { ActivityItem, WidgetStatus } from "@/types/dashboard.ts";

interface NotificationsWidgetProps {
  items: ActivityItem[];
  status: WidgetStatus;
  onRetry?: () => void;
}

export function NotificationsWidget({ items, status, onRetry }: NotificationsWidgetProps) {
  const unread = items.filter((i) => !i.isRead);

  return (
    <WidgetContainer
      title="Notifications"
      status={status}
      {...(onRetry !== undefined ? { onRetry } : {})}
      compact
      {...(unread.length > 0 ? {
        headerAction: (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground tabular-nums">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )
      } : {})}
    >
      {items.length === 0 ? (
        <WidgetEmpty icon={Bell} message="No notifications." />
      ) : (
        <div className="flex flex-col gap-0.5 -mx-1">
          {items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-2.5 rounded-lg px-3 py-2.5",
                !item.isRead && "bg-primary/[0.03]"
              )}
            >
              {!item.isRead && (
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                  aria-label="Unread"
                />
              )}
              <p
                className={cn(
                  "flex-1 text-xs leading-relaxed",
                  item.isRead ? "text-muted-foreground" : "text-foreground font-medium"
                )}
              >
                {item.title}
              </p>
            </div>
          ))}
          {items.length > 4 && (
            <Link
              href="/activity"
              className="mt-2 flex items-center gap-1 px-3 text-xs font-medium text-primary hover:underline underline-offset-2"
            >
              View all {items.length} notifications
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
