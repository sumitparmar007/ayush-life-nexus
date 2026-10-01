"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Plus } from "lucide-react";
import { Button } from "@nexus/ui";

interface EmptyConsentStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export function EmptyConsentState({
  isFiltered = false,
  onResetFilters,
}: EmptyConsentStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <ShieldCheck className="size-8 text-muted-foreground/40" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          {isFiltered ? "No matching consent records" : "No active consents or requests"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isFiltered
            ? "Try adjusting your search, status, or recipient filter."
            : "You have complete control over who can view your health records, prescriptions, and lab tests."}
        </p>
      </div>
      {isFiltered ? (
        onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Clear filters
          </Button>
        )
      ) : (
        <Link href="/consent/add">
          <Button leftIcon={<Plus />}>Grant your first consent</Button>
        </Link>
      )}
    </div>
  );
}
