"use client";

import * as React from "react";
import Link from "next/link";
import { Shield, Plus } from "lucide-react";
import { Button } from "@nexus/ui";

interface EmptyInsuranceStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export function EmptyInsuranceState({
  isFiltered = false,
  onResetFilters,
}: EmptyInsuranceStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Shield className="size-8 text-muted-foreground/40" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          {isFiltered ? "No matching insurance policies" : "No insurance policies linked"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isFiltered
            ? "Try adjusting your search, status, or policy type filter."
            : "Add your health insurance, family floater, and critical illness policies to track cashless coverage and renewals."}
        </p>
      </div>
      {isFiltered ? (
        onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Clear filters
          </Button>
        )
      ) : (
        <Link href="/insurance/add">
          <Button leftIcon={<Plus />}>Link your first policy</Button>
        </Link>
      )}
    </div>
  );
}
