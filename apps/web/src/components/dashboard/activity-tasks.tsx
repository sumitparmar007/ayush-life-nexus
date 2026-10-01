import * as React from "react";
import Link from "next/link";
import {
  FileText, ShieldCheck, FlaskConical, Pill, Shield, LogIn,
  CheckCircle2, CheckCheck, ArrowRight,
  AlertCircle, Eye,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { Badge } from "@nexus/ui";
import { WidgetContainer, WidgetEmpty } from "./widget-container.tsx";
import type { ActivityItem, DashboardTask, ActivityType, TaskPriority, WidgetStatus } from "@/types/dashboard.ts";

// ─── Activity Feed ────────────────────────────────────────────────────────────

const activityIconMap: Record<ActivityType, React.ElementType> = {
  RECORD_ADDED: FileText,
  RECORD_VERIFIED: CheckCircle2,
  CONSENT_REQUESTED: Shield,
  CONSENT_GRANTED: ShieldCheck,
  CONSENT_REJECTED: Shield,
  CONSENT_REVOKED: ShieldCheck,
  PATIENT_DATA_ACCESSED: Eye,
  LAB_RESULT_RECEIVED: FlaskConical,
  MEDICATION_DISPENSED: Pill,
  PRESCRIPTION_CREATED: Pill,
  INSURANCE_UPDATED: Shield,
  LOGIN: LogIn,
};

const activityColorMap: Record<ActivityType, string> = {
  RECORD_ADDED: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  RECORD_VERIFIED: "bg-sage-100 text-sage-600 dark:bg-sage-950 dark:text-sage-400",
  CONSENT_REQUESTED: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  CONSENT_GRANTED: "bg-sage-100 text-sage-600 dark:bg-sage-950 dark:text-sage-400",
  CONSENT_REJECTED: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  CONSENT_REVOKED: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  PATIENT_DATA_ACCESSED: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  LAB_RESULT_RECEIVED: "bg-saffron-100 text-saffron-600 dark:bg-saffron-950 dark:text-saffron-400",
  MEDICATION_DISPENSED: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  PRESCRIPTION_CREATED: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  INSURANCE_UPDATED: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  LOGIN: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  status: WidgetStatus;
  onRetry?: () => void;
}

export function ActivityFeed({ items, status, onRetry }: ActivityFeedProps) {
  return (
    <WidgetContainer title="Recent Activity" status={status} {...(onRetry !== undefined ? { onRetry } : {})}>
      {items.length === 0 ? (
        <WidgetEmpty icon={CheckCheck} message="No recent activity." />
      ) : (
        <ul role="list" className="flex flex-col gap-0.5 -mx-1">
          {items.map((item) => {
            const Icon = activityIconMap[item.type];
            const colorClass = activityColorMap[item.type];
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-2.5",
                  "transition-colors hover:bg-muted/60",
                  !item.isRead && "bg-primary/[0.02]"
                )}
              >
                <span
                  className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", colorClass)}
                  aria-hidden="true"
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden min-w-0">
                  <p className="truncate text-sm font-medium text-foreground leading-snug">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <time className="shrink-0 text-xs text-muted-foreground/60 tabular-nums">
                  {formatRelativeTime(item.timestamp)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetContainer>
  );
}

// ─── Upcoming Tasks ───────────────────────────────────────────────────────────

const priorityConfig: Record<TaskPriority, { label: string; variant: "destructive" | "warning" | "default" }> = {
  HIGH: { label: "High", variant: "destructive" },
  MEDIUM: { label: "Medium", variant: "warning" },
  LOW: { label: "Low", variant: "default" },
};

interface UpcomingTasksProps {
  tasks: DashboardTask[];
  status: WidgetStatus;
  onRetry?: () => void;
}

export function UpcomingTasks({ tasks, status, onRetry }: UpcomingTasksProps) {
  return (
    <WidgetContainer title="Recommended Actions" status={status} {...(onRetry !== undefined ? { onRetry } : {})}>
      {tasks.length === 0 ? (
        <WidgetEmpty
          icon={CheckCircle2}
          message="All caught up! No actions needed right now."
        />
      ) : (
        <ul role="list" className="flex flex-col gap-2">
          {tasks.map((task) => {
            const priority = priorityConfig[task.priority];
            return (
              <li
                key={task.id}
                className="flex items-start gap-3 rounded-xl border border-border p-3 transition-shadow hover:shadow-card"
              >
                <AlertCircle
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    task.priority === "HIGH" ? "text-rose-500" :
                    task.priority === "MEDIUM" ? "text-amber-500" : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {task.title}
                    </p>
                    <Badge variant={priority.variant} size="sm">
                      {priority.label}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  )}
                  {task.actionLabel && task.actionHref && (
                    <Link
                      href={task.actionHref}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2"
                    >
                      {task.actionLabel}
                      <ArrowRight className="size-3" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetContainer>
  );
}
