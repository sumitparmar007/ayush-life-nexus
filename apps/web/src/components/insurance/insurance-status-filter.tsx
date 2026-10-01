"use client";

import * as React from "react";
import { cn } from "@nexus/utils";
import {
  InsurancePolicyStatus,
  InsurancePolicyType,
  INSURANCE_POLICY_STATUS_LABELS,
  INSURANCE_POLICY_TYPE_LABELS,
} from "@/types/insurance.ts";

interface InsuranceStatusFilterProps {
  selectedStatus: InsurancePolicyStatus | undefined;
  selectedType: InsurancePolicyType | undefined;
  onStatusChange: (status: InsurancePolicyStatus | undefined) => void;
  onTypeChange: (type: InsurancePolicyType | undefined) => void;
  className?: string;
}

const statuses = Object.entries(INSURANCE_POLICY_STATUS_LABELS) as [
  InsurancePolicyStatus,
  string,
][];

const types = Object.entries(INSURANCE_POLICY_TYPE_LABELS) as [
  InsurancePolicyType,
  string,
][];

export function InsuranceStatusFilter({
  selectedStatus,
  selectedType,
  onStatusChange,
  onTypeChange,
  className,
}: InsuranceStatusFilterProps) {
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

      {/* Policy Type Filter */}
      <div
        className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2"
        role="group"
        aria-label="Filter by policy type"
      >
        <span className="text-xs text-muted-foreground font-medium mr-1">Plan Type:</span>
        <button
          onClick={() => onTypeChange(undefined)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selectedType === undefined
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          All Types
        </button>
        {types.map(([typeKey, label]) => (
          <button
            key={typeKey}
            onClick={() =>
              onTypeChange(selectedType === typeKey ? undefined : typeKey)
            }
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedType === typeKey
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
