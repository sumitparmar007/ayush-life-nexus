"use client";

import * as React from "react";
import Link from "next/link";
import { Pill, Plus } from "lucide-react";
import { Button } from "@nexus/ui";

interface EmptyMedicationsStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export function EmptyMedicationsState({
  isFiltered = false,
  onResetFilters,
}: EmptyMedicationsStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Pill className="size-8 text-muted-foreground/40" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          {isFiltered ? "No matching medications" : "No medications tracked yet"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isFiltered
            ? "Try adjusting your search or status filter."
            : "Add your active prescriptions, supplements, and daily medications to keep your regimen organized."}
        </p>
      </div>
      {isFiltered ? (
        onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Clear filters
          </Button>
        )
      ) : (
        <Link href="/medications/add">
          <Button leftIcon={<Plus />}>Add your first medication</Button>
        </Link>
      )}
    </div>
  );
}
