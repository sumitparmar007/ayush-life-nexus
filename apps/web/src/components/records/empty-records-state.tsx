"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import { Button } from "@nexus/ui";

interface EmptyRecordsStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export function EmptyRecordsState({
  isFiltered = false,
  onResetFilters,
}: EmptyRecordsStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <FileText className="size-8 text-muted-foreground/40" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          {isFiltered ? "No matching records" : "No health records yet"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isFiltered
            ? "Try adjusting your search or filters."
            : "Upload your first medical record to get started. Prescriptions, lab reports, discharge summaries — all in one place."}
        </p>
      </div>
      {isFiltered ? (
        onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Clear filters
          </Button>
        )
      ) : (
        <Link href="/records/upload">
          <Button leftIcon={<Upload />}>Upload your first record</Button>
        </Link>
      )}
    </div>
  );
}
