"use client";

import * as React from "react";
import { Activity, RotateCcw } from "lucide-react";
import { Button } from "@nexus/ui";

interface EmptyActivityStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export function EmptyActivityState({
  isFiltered = false,
  onResetFilters,
}: EmptyActivityStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Activity className="size-8 text-muted-foreground/40" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          {isFiltered ? "No matching activity events" : "No activity recorded yet"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isFiltered
            ? "Try adjusting your search terms or activity category filter."
            : "Actions such as adding health records, tracking medications, recording lab results, updating insurance, and granting data consent will appear here in your audit log."}
        </p>
      </div>
      {isFiltered && onResetFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          leftIcon={<RotateCcw />}
        >
          Reset filters
        </Button>
      )}
    </div>
  );
}
