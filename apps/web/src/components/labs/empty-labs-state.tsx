"use client";

import * as React from "react";
import Link from "next/link";
import { FlaskConical, Plus } from "lucide-react";
import { Button } from "@nexus/ui";

interface EmptyLabsStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export function EmptyLabsState({
  isFiltered = false,
  onResetFilters,
}: EmptyLabsStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <FlaskConical className="size-8 text-muted-foreground/40" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          {isFiltered ? "No matching lab results" : "No lab test results recorded"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isFiltered
            ? "Try adjusting your search, category, or status filter."
            : "Record your blood tests, metabolic panels, lipid profiles, and diagnostic markers to track your health trends."}
        </p>
      </div>
      {isFiltered ? (
        onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Clear filters
          </Button>
        )
      ) : (
        <Link href="/labs/add">
          <Button leftIcon={<Plus />}>Record your first lab test</Button>
        </Link>
      )}
    </div>
  );
}
