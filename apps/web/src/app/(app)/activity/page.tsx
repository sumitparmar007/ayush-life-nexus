"use client";

/**
 * Activity Log Timeline Page — /activity
 *
 * Provides a patient-facing audit timeline of health data events, consent grants,
 * medication updates, lab reports, and sign-in sessions.
 */

import * as React from "react";
import { Search, CheckCheck, RefreshCw } from "lucide-react";
import { Button, Input } from "@nexus/ui";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { ActivityFilter } from "@/components/activity/activity-filter.tsx";
import { ActivityTimeline } from "@/components/activity/activity-timeline.tsx";
import { EmptyActivityState } from "@/components/activity/empty-activity-state.tsx";
import { useActivity } from "@/hooks/use-activity.ts";
import type { ActivityType } from "@/types/activity.ts";

export default function ActivityPage() {
  const {
    isLoading,
    activities,
    total,
    unreadCount,
    error,
    filters,
    updateFilters,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useActivity();

  const [searchInput, setSearchInput] = React.useState("");
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced search input
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchInput(val);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        updateFilters({ search: val || undefined });
      }, 300);
    },
    [updateFilters]
  );

  const handleTypeChange = React.useCallback(
    (type: ActivityType | undefined) => {
      updateFilters({ type });
    },
    [updateFilters]
  );

  const handleUnreadToggle = React.useCallback(
    (unreadOnly: boolean) => {
      updateFilters({ unreadOnly: unreadOnly ? true : undefined });
    },
    [updateFilters]
  );

  const isFiltered = Boolean(
    filters.search || filters.type || filters.unreadOnly
  );

  const handleResetFilters = React.useCallback(() => {
    setSearchInput("");
    updateFilters({
      search: undefined,
      type: undefined,
      unreadOnly: undefined,
    });
  }, [updateFilters]);

  return (
    <PageContainer maxWidth="2xl">
      <BreadcrumbHeader
        segments={[{ label: "Activity Log" }]}
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
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void markAllAsRead()}
                leftIcon={<CheckCheck />}
              >
                Mark all read
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Activity Log & Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground">
            A chronological timeline of updates, data sharing consents, prescriptions, lab results, and security events.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Search activity events..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>

          <ActivityFilter
            selectedType={filters.type}
            unreadOnly={filters.unreadOnly}
            unreadCount={unreadCount}
            onTypeChange={handleTypeChange}
            onUnreadToggle={handleUnreadToggle}
          />
        </div>

        {/* Results Header */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {activities.length} of {total} {total === 1 ? "event" : "events"}
              {isFiltered && " (filtered)"}
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Content Area */}
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
          <div className="flex flex-col gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl border border-border bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyActivityState
            isFiltered={isFiltered}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <ActivityTimeline
            activities={activities}
            onMarkRead={markAsRead}
          />
        )}
      </div>
    </PageContainer>
  );
}
