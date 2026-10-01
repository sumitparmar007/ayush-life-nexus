"use client";

/**
 * Medications list page — /medications
 *
 * Search, filter by status, and browse all medications.
 */

import * as React from "react";
import Link from "next/link";
import { Search, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button, Input } from "@nexus/ui";
import { cn } from "@nexus/utils";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { MedicationCard } from "@/components/medications/medication-card.tsx";
import { MedicationStatusFilter } from "@/components/medications/medication-status-filter.tsx";
import { EmptyMedicationsState } from "@/components/medications/empty-medications-state.tsx";
import { useMedications } from "@/hooks/use-medications.ts";
import type { MedicationStatus } from "@/types/medications.ts";

export default function MedicationsPage() {
  const {
    isLoading,
    medications,
    total,
    error,
    filters,
    updateFilters,
    refresh,
  } = useMedications();

  const [searchInput, setSearchInput] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced search
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        updateFilters({ search: value || undefined });
      }, 300);
    },
    [updateFilters]
  );

  const handleStatusChange = React.useCallback(
    (status: MedicationStatus | undefined) => {
      updateFilters({ status });
    },
    [updateFilters]
  );

  const handleStatusToggle = React.useCallback(
    async (id: string, newStatus: MedicationStatus) => {
      try {
        const res = await fetch(`/api/medications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) refresh();
      } catch {
        // Silently fail
      }
    },
    [refresh]
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this medication?")) return;
      try {
        const res = await fetch(`/api/medications/${id}`, { method: "DELETE" });
        if (res.ok) refresh();
      } catch {
        // Silently fail
      }
    },
    [refresh]
  );

  return (
    <PageContainer maxWidth="2xl">
      <BreadcrumbHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Medications" },
        ]}
        title="Medications"
        description="Track active medications, dosages, and dosing schedules"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              leftIcon={<RefreshCw />}
              isLoading={isLoading}
              aria-label="Refresh medications"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Link href="/medications/add">
              <Button size="sm" leftIcon={<Plus />}>
                Add Medication
              </Button>
            </Link>
          </div>
        }
      />

      {/* Search + filter toggle */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search medications by name, instructions, or doctor…"
            leftIcon={<Search />}
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          leftIcon={<SlidersHorizontal />}
          className={cn(showFilters && "bg-primary/5 border-primary/30")}
        >
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Status filters */}
      {showFilters && (
        <div className="animate-slide-in-top">
          <MedicationStatusFilter
            value={filters.status}
            onChange={handleStatusChange}
          />
        </div>
      )}

      {/* Count */}
      {!isLoading && !error && (
        <p className="text-xs text-muted-foreground">
          {total === 0
            ? "No medications found"
            : `${total} medication${total === 1 ? "" : "s"}`}
          {filters.status && ` (${filters.status.toLowerCase()})`}
          {filters.search && ` matching "${filters.search}"`}
        </p>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-muted animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && medications.length === 0 && (
        <EmptyMedicationsState
          isFiltered={Boolean(filters.search || filters.status)}
          onResetFilters={() => {
            setSearchInput("");
            updateFilters({ search: undefined, status: undefined });
          }}
        />
      )}

      {/* Medications list */}
      {!isLoading && !error && medications.length > 0 && (
        <div className="flex flex-col gap-3">
          {medications.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              onDelete={handleDelete}
              onStatusChange={handleStatusToggle}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
