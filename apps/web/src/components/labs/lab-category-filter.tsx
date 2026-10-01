"use client";

import * as React from "react";
import { cn } from "@nexus/utils";
import {
  LabCategory,
  LabResultStatus,
  LAB_CATEGORY_LABELS,
  LAB_RESULT_STATUS_LABELS,
} from "@/types/labs.ts";

interface LabCategoryFilterProps {
  selectedCategory: LabCategory | undefined;
  selectedStatus: LabResultStatus | undefined;
  onCategoryChange: (category: LabCategory | undefined) => void;
  onStatusChange: (status: LabResultStatus | undefined) => void;
  className?: string;
}

const categories = Object.entries(LAB_CATEGORY_LABELS) as [
  LabCategory,
  string,
][];

const statuses = Object.entries(LAB_RESULT_STATUS_LABELS) as [
  LabResultStatus,
  string,
][];

export function LabCategoryFilter({
  selectedCategory,
  selectedStatus,
  onCategoryChange,
  onStatusChange,
  className,
}: LabCategoryFilterProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Category Pills */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Filter by category"
      >
        <button
          onClick={() => onCategoryChange(undefined)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selectedCategory === undefined
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          )}
        >
          All Categories
        </button>
        {categories.map(([category, label]) => (
          <button
            key={category}
            onClick={() =>
              onCategoryChange(selectedCategory === category ? undefined : category)
            }
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedCategory === category
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status Badges Filter */}
      <div
        className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2"
        role="group"
        aria-label="Filter by status"
      >
        <span className="text-xs text-muted-foreground font-medium mr-1">Status:</span>
        <button
          onClick={() => onStatusChange(undefined)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selectedStatus === undefined
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          All
        </button>
        {statuses.map(([status, label]) => (
          <button
            key={status}
            onClick={() =>
              onStatusChange(selectedStatus === status ? undefined : status)
            }
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedStatus === status
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
