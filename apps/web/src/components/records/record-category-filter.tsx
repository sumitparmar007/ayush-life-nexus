"use client";

import * as React from "react";
import { cn } from "@nexus/utils";
import {
  RecordCategory,
  RECORD_CATEGORY_LABELS,
} from "@/types/health-records.ts";

interface RecordCategoryFilterProps {
  value: RecordCategory | undefined;
  onChange: (category: RecordCategory | undefined) => void;
  className?: string;
}

const categories = Object.entries(RECORD_CATEGORY_LABELS) as [RecordCategory, string][];

export function RecordCategoryFilter({
  value,
  onChange,
  className,
}: RecordCategoryFilterProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      role="group"
      aria-label="Filter by category"
    >
      <button
        onClick={() => onChange(undefined)}
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          value === undefined
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
        )}
      >
        All
      </button>
      {categories.map(([cat, label]) => (
        <button
          key={cat}
          onClick={() => onChange(value === cat ? undefined : cat)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === cat
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
