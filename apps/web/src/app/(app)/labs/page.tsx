"use client";

/**
 * Lab Results list page — /labs
 *
 * Search, filter by category and status, and browse all diagnostic test results.
 */

import * as React from "react";
import Link from "next/link";
import { Search, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button, Input } from "@nexus/ui";
import { cn } from "@nexus/utils";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { LabCard } from "@/components/labs/lab-card.tsx";
import { LabCategoryFilter } from "@/components/labs/lab-category-filter.tsx";
import { EmptyLabsState } from "@/components/labs/empty-labs-state.tsx";
import { useLabs } from "@/hooks/use-labs.ts";
import type { LabCategory, LabResultStatus } from "@/types/labs.ts";

export default function LabsPage() {
  const {
    isLoading,
    labs,
    total,
    error,
    filters,
    updateFilters,
    refresh,
  } = useLabs();

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

  const handleCategoryChange = React.useCallback(
    (category: LabCategory | undefined) => {
      updateFilters({ category });
    },
    [updateFilters]
  );

  const handleStatusChange = React.useCallback(
    (status: LabResultStatus | undefined) => {
      updateFilters({ status });
    },
    [updateFilters]
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this lab result?")) return;
      try {
        const res = await fetch(`/api/labs/${id}`, { method: "DELETE" });
        if (res.ok) refresh();
      } catch {
        // Silently fail
      }
    },
    [refresh]
  );

  const isFiltered = Boolean(
    filters.search || filters.category || filters.status
  );

  const handleResetFilters = React.useCallback(() => {
    setSearchInput("");
    updateFilters({ search: undefined, category: undefined, status: undefined });
  }, [updateFilters]);

  return (
    <PageContainer>
      <BreadcrumbHeader
        segments={[{ label: "Lab Results" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              leftIcon={<RefreshCw className={isLoading ? "animate-spin" : ""} />}
            >
              Refresh
            </Button>
            <Link href="/labs/add">
              <Button size="sm" leftIcon={<Plus />}>
                Record Lab Test
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        {/* Page Title & Overview */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Lab Results & Diagnostics
          </h1>
          <p className="text-sm text-muted-foreground">
            Track blood tests, metabolic panels, and diagnostic biomarkers over time.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search biomarkers, diagnostic centers, values, or clinical notes..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((o) => !o)}
              leftIcon={<SlidersHorizontal />}
              className={cn(
                "shrink-0",
                (filters.category || filters.status) &&
                  "border-primary text-primary"
              )}
            >
              Filters
              {(filters.category || filters.status) && (
                <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {(filters.category ? 1 : 0) + (filters.status ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Collapsible Filter Bar */}
          {showFilters && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs animate-slide-in-top">
              <LabCategoryFilter
                selectedCategory={filters.category}
                selectedStatus={filters.status}
                onCategoryChange={handleCategoryChange}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </div>

        {/* Results Header */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {labs.length} of {total} {total === 1 ? "result" : "results"}
              {isFiltered && " (filtered)"}
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Content area */}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
            <p className="text-sm font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="mt-3"
            >
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-border bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : labs.length === 0 ? (
          <EmptyLabsState
            isFiltered={isFiltered}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {labs.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
