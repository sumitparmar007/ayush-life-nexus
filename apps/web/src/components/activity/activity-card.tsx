"use client";

import * as React from "react";
import {
  FileText,
  ShieldCheck,
  FlaskConical,
  Pill,
  Shield,
  LogIn,
  CheckCircle2,
  Check,
  Eye,
} from "lucide-react";
import { cn } from "@nexus/utils";
import { ActivityType, type ActivityItem } from "@/types/activity.ts";
import { format } from "date-fns";

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
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

const ACTIVITY_COLORS: Record<ActivityType, string> = {
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

interface ActivityCardProps {
  activity: ActivityItem;
  onMarkRead?: ((id: string) => void) | undefined;
}

export function ActivityCard({ activity, onMarkRead }: ActivityCardProps) {
  const Icon = ACTIVITY_ICONS[activity.type] ?? FileText;
  const colorClass = ACTIVITY_COLORS[activity.type] ?? ACTIVITY_COLORS.RECORD_ADDED;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-2xl border bg-card p-4 transition-all duration-150",
        activity.isRead
          ? "border-border hover:border-border/80"
          : "border-primary/30 bg-primary/[0.015] shadow-xs hover:border-primary/50"
      )}
    >
      {/* Type Icon */}
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          colorClass
        )}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!activity.isRead && (
              <span
                className="size-2 rounded-full bg-primary shrink-0"
                title="Unread event"
              />
            )}
            <h4 className="text-sm font-semibold text-foreground leading-snug">
              {activity.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <time className="text-xs text-muted-foreground tabular-nums">
              {formatRelativeTime(activity.timestamp)}
            </time>
          </div>
        </div>

        {activity.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {activity.description}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground/70">
          <span>{format(activity.timestamp, "dd MMM yyyy, HH:mm:ss")}</span>

          {!activity.isRead && onMarkRead && (
            <button
              type="button"
              onClick={() => onMarkRead(activity.id)}
              className="flex items-center gap-1 text-primary hover:underline font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Check className="size-3" />
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
