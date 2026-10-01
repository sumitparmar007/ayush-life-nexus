"use client";

import * as React from "react";
import { cn } from "@nexus/utils";
import {
  ConsentStatus,
  ConsentRecipientType,
  CONSENT_STATUS_LABELS,
  CONSENT_RECIPIENT_TYPE_LABELS,
} from "@/types/consent.ts";

interface ConsentStatusFilterProps {
  selectedStatus: ConsentStatus | undefined;
  selectedRecipientType: ConsentRecipientType | undefined;
  onStatusChange: (status: ConsentStatus | undefined) => void;
  onRecipientTypeChange: (type: ConsentRecipientType | undefined) => void;
  className?: string;
}

const statuses = Object.entries(CONSENT_STATUS_LABELS) as [
  ConsentStatus,
  string,
][];

const recipientTypes = Object.entries(CONSENT_RECIPIENT_TYPE_LABELS) as [
  ConsentRecipientType,
  string,
][];

export function ConsentStatusFilter({
  selectedStatus,
  selectedRecipientType,
  onStatusChange,
  onRecipientTypeChange,
  className,
}: ConsentStatusFilterProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Status Pills */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Filter by status"
      >
        <button
          onClick={() => onStatusChange(undefined)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selectedStatus === undefined
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          )}
        >
          All Statuses
        </button>
        {statuses.map(([status, label]) => (
          <button
            key={status}
            onClick={() =>
              onStatusChange(selectedStatus === status ? undefined : status)
            }
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedStatus === status
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Recipient Type Filter */}
      <div
        className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2"
        role="group"
        aria-label="Filter by recipient type"
      >
        <span className="text-xs text-muted-foreground font-medium mr-1">Recipient:</span>
        <button
          onClick={() => onRecipientTypeChange(undefined)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selectedRecipientType === undefined
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          All Entities
        </button>
        {recipientTypes.map(([typeKey, label]) => (
          <button
            key={typeKey}
            onClick={() =>
              onRecipientTypeChange(
                selectedRecipientType === typeKey ? undefined : typeKey
              )
            }
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedRecipientType === typeKey
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
