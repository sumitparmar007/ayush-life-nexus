"use client";

/**
 * Health Records list page — /records
 *
 * Search, filter by category, and browse all records.
 */

import * as React from "react";
import Link from "next/link";
import { Search, Upload, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button, Input } from "@nexus/ui";
import { cn } from "@nexus/utils";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { RecordCard } from "@/components/records/record-card.tsx";
import { RecordCategoryFilter } from "@/components/records/record-category-filter.tsx";
import { EmptyRecordsState } from "@/components/records/empty-records-state.tsx";
import { useHealthRecords } from "@/hooks/use-health-records.ts";
import type { RecordCategory } from "@/types/health-records.ts";

export default function RecordsPage() {
  const {
    isLoading,
    records,
    total,
    error,
    filters,
    updateFilters,
    refresh,
  } = useHealthRecords();

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
    (category: RecordCategory | undefined) => {
      updateFilters({ category });
    },
    [updateFilters]
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this record?")) return;
      try {
        const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
        if (res.ok) refresh();
      } catch {
        // Silently fail — user will see the record still there
      }
    },
    [refresh]
  );

  return (
    <PageContainer maxWidth="2xl">
      <BreadcrumbHeader
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Health Records" },
        ]}
        title="Health Records"
        description="View, upload, and manage your medical records"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              leftIcon={<RefreshCw />}
              isLoading={isLoading}
              aria-label="Refresh records"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Link href="/records/upload">
              <Button
                size="sm"
                leftIcon={<Upload />}
              >
                Upload Record
              </Button>
            </Link>
          </div>
        }
      />

      {/* Search + filter toggle */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search records by title, provider, or file name…"
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
          className={cn(
            showFilters && "bg-primary/5 border-primary/30"
          )}
        >
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Category filters */}
      {showFilters && (
        <div className="animate-slide-in-top">
          <RecordCategoryFilter
            value={filters.category}
            onChange={handleCategoryChange}
          />
        </div>
      )}

      {/* Records count */}
      {!isLoading && !error && (
        <p className="text-xs text-muted-foreground">
          {total === 0
            ? "No records found"
            : `${total} record${total === 1 ? "" : "s"}`}
          {filters.category && " (filtered)"}
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
      {!isLoading && !error && records.length === 0 && (
        <EmptyRecordsState
          isFiltered={Boolean(filters.search || filters.category)}
          onResetFilters={() => {
            setSearchInput("");
            updateFilters({ search: undefined, category: undefined });
          }}
        />
      )}

      {/* Records list */}
      {!isLoading && !error && records.length > 0 && (
        <div className="flex flex-col gap-3">
          {records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
