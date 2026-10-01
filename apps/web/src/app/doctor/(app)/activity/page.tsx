"use client";

/**
 * Doctor Activity & Audit Log Page — /doctor/activity
 *
 * Provides a Doctor-facing privacy-first audit trail of account logins,
 * consent requests, consent lifecycle responses, patient data access, and prescriptions.
 * Reuses the centralized Activity Log architecture while strictly isolating to the authenticated Doctor.
 */

import * as React from "react";
import { Search, CheckCheck, RefreshCw, Activity, RotateCcw } from "lucide-react";
import { Button, Input } from "@nexus/ui";
import { cn } from "@nexus/utils";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { ActivityTimeline } from "@/components/activity/activity-timeline.tsx";
import { useActivity } from "@/hooks/use-activity.ts";
import { ActivityType } from "@/types/activity.ts";

type DoctorFilterCategory = "ALL" | "LOGIN" | "CONSENT" | "PATIENT_ACCESS" | "PRESCRIPTIONS";

const DOCTOR_CATEGORIES: { label: string; key: DoctorFilterCategory; type?: ActivityType }[] = [
  { label: "All Events", key: "ALL" },
  { label: "Login", key: "LOGIN", type: ActivityType.LOGIN },
  { label: "Consent Requests", key: "CONSENT", type: ActivityType.CONSENT_REQUESTED },
  { label: "Patient Access", key: "PATIENT_ACCESS", type: ActivityType.PATIENT_DATA_ACCESSED },
  { label: "Prescriptions", key: "PRESCRIPTIONS", type: ActivityType.PRESCRIPTION_CREATED },
];

export default function DoctorActivityPage() {
  const {
    isLoading,
    activities,
    unreadCount,
    error,
    filters,
    updateFilters,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useActivity();

  const [activeCategory, setActiveCategory] = React.useState<DoctorFilterCategory>("ALL");
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

  const handleCategoryChange = React.useCallback(
    (cat: DoctorFilterCategory, type?: ActivityType) => {
      setActiveCategory(cat);
      updateFilters({ type: type || undefined });
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
    filters.search || filters.type || filters.unreadOnly || activeCategory !== "ALL"
  );

  const handleResetFilters = React.useCallback(() => {
    setSearchInput("");
    setActiveCategory("ALL");
    updateFilters({
      search: undefined,
      type: undefined,
      unreadOnly: undefined,
    });
  }, [updateFilters]);

  return (
    <PageContainer maxWidth="2xl">
      <div className="space-y-6">
        <BreadcrumbHeader
          segments={[
            { label: "Doctor Portal", href: "/doctor/dashboard" },
            { label: "Activity Log" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                leftIcon={<RefreshCw className={cn("size-4", isLoading ? "animate-spin" : "")} />}
              >
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void markAllAsRead()}
                  leftIcon={<CheckCheck className="size-4" />}
                >
                  Mark all read
                </Button>
              )}
            </div>
          }
        />

        {/* Page Title & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Doctor Activity & Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Privacy-first audit trail of your clinical actions, consent requests, patient access, and prescriptions.
          </p>
        </div>

        {/* Controls Bar: Search & Category Filters */}
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-2xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search audit actions, patients, or descriptions…"
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-9 text-xs sm:text-sm"
            />
          </div>

          {/* Category Filter Pills & Unread Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Filter activity events by category"
            >
              {DOCTOR_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleCategoryChange(cat.key, cat.type)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Unread Only Toggle */}
            <button
              type="button"
              onClick={() => handleUnreadToggle(!filters.unreadOnly)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filters.unreadOnly
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <span>Unread only</span>
              {unreadCount > 0 && (
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full text-[10px]",
                    filters.unreadOnly
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && activities.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <RefreshCw className="size-6 animate-spin text-primary" />
            <p className="text-sm">Loading activity audit log…</p>
          </div>
        )}

        {/* Content or Empty State */}
        {!isLoading && activities.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-dashed border-border bg-card/50 p-8">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
              <Activity className="size-8 text-muted-foreground/40" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-foreground">
                {isFiltered ? "No matching activity events" : "No activity yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {isFiltered
                  ? "Try adjusting your search terms or category filter."
                  : "Your important account, consent and patient-access actions will appear here."}
              </p>
            </div>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw className="size-4" />}
              >
                Reset filters
              </Button>
            )}
          </div>
        ) : (
          <ActivityTimeline
            activities={activities}
            onMarkRead={(id) => void markAsRead(id)}
          />
        )}
      </div>
    </PageContainer>
  );
}
