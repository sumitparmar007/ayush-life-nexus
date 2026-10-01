"use client";

import * as React from "react";
import { cn } from "@nexus/utils";
import { ActivityType } from "@/types/activity.ts";

interface ActivityFilterProps {
  selectedType: ActivityType | undefined;
  unreadOnly?: boolean | undefined;
  unreadCount: number;
  onTypeChange: (type: ActivityType | undefined) => void;
  onUnreadToggle: (unreadOnly: boolean) => void;
  className?: string | undefined;
}

const CATEGORIES: { label: string; type?: ActivityType }[] = [
  { label: "All Events" },
  { label: "Health Records", type: ActivityType.RECORD_ADDED },
  { label: "Medications", type: ActivityType.MEDICATION_DISPENSED },
  { label: "Lab Results", type: ActivityType.LAB_RESULT_RECEIVED },
  { label: "Insurance", type: ActivityType.INSURANCE_UPDATED },
  { label: "Consent Grants", type: ActivityType.CONSENT_GRANTED },
  { label: "Consent Revocations", type: ActivityType.CONSENT_REVOKED },
  { label: "Sign-in Sessions", type: ActivityType.LOGIN },
];

export function ActivityFilter({
  selectedType,
  unreadOnly = false,
  unreadCount,
  onTypeChange,
  onUnreadToggle,
  className,
}: ActivityFilterProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      {/* Category Pills */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Filter activity events by category"
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedType === cat.type;
          return (
            <button
              key={cat.label}
              onClick={() => onTypeChange(isSelected ? undefined : cat.type)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Unread Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onUnreadToggle(!unreadOnly)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            unreadOnly
              ? "border-primary bg-primary/10 text-primary font-semibold"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <span>Unread only</span>
          {unreadCount > 0 && (
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full text-[10px]",
                unreadOnly
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground"
              )}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
