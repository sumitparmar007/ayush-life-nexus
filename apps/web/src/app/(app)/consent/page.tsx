"use client";

/**
 * Consent list page — /consent
 *
 * Search, filter by status and recipient entity, manage active grants, and approve pending requests.
 */

import * as React from "react";
import Link from "next/link";
import { Search, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button, Input } from "@nexus/ui";
import { cn } from "@nexus/utils";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { BreadcrumbHeader } from "@/components/layout/breadcrumb-header.tsx";
import { ConsentCard } from "@/components/consent/consent-card.tsx";
import { ConsentStatusFilter } from "@/components/consent/consent-status-filter.tsx";
import { EmptyConsentState } from "@/components/consent/empty-consent-state.tsx";
import { useConsent } from "@/hooks/use-consent.ts";
import type {
  ConsentStatus,
  ConsentRecipientType,
} from "@/types/consent.ts";

export default function ConsentPage() {
  const {
    isLoading,
    consents,
    total,
    error,
    filters,
    updateFilters,
    approveConsent,
    rejectConsent,
    revokeConsent,
    refresh,
  } = useConsent();

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
    (status: ConsentStatus | undefined) => {
      updateFilters({ status });
    },
    [updateFilters]
  );

  const handleRecipientTypeChange = React.useCallback(
    (recipientType: ConsentRecipientType | undefined) => {
      updateFilters({ recipientType });
    },
    [updateFilters]
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this consent record?")) {
        return;
      }
      try {
        const res = await fetch(`/api/consent/${id}`, { method: "DELETE" });
        if (res.ok) refresh();
      } catch {
        // Silently fail
      }
    },
    [refresh]
  );

  const isFiltered = Boolean(
    filters.search || filters.status || filters.recipientType
  );

  const handleResetFilters = React.useCallback(() => {
    setSearchInput("");
    updateFilters({
      search: undefined,
      status: undefined,
      recipientType: undefined,
    });
  }, [updateFilters]);

  // Separate pending requests for highlighted banner if present
  const pendingRequests = React.useMemo(
    () => consents.filter((c) => c.status === "PENDING_APPROVAL"),
    [consents]
  );

  return (
    <PageContainer>
      <BreadcrumbHeader
        segments={[{ label: "Consent & Privacy" }]}
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
            <Link href="/consent/add">
              <Button size="sm" leftIcon={<Plus />}>
                Grant Consent
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        {/* Page Title & Overview */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Consent & Data Privacy
          </h1>
          <p className="text-sm text-muted-foreground">
            Control which doctors, hospitals, and insurers can access your medical records, prescriptions, and lab tests.
          </p>
        </div>

        {/* Pending Requests Alert Banner */}
        {!isLoading && pendingRequests.length > 0 && !filters.status && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {pendingRequests.length} Pending Consent Request{pendingRequests.length > 1 ? "s" : ""}
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Healthcare providers have requested access to your records. Review and approve or reject access below.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-amber-300 dark:border-amber-800"
                onClick={() => handleStatusChange("PENDING_APPROVAL")}
              >
                View Pending Requests
              </Button>
            </div>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search recipient name, clinic, hospital, or purpose..."
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
                (filters.status || filters.recipientType) &&
                  "border-primary text-primary"
              )}
            >
              Filters
              {(filters.status || filters.recipientType) && (
                <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {(filters.status ? 1 : 0) + (filters.recipientType ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Collapsible Filter Bar */}
          {showFilters && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs animate-slide-in-top">
              <ConsentStatusFilter
                selectedStatus={filters.status}
                selectedRecipientType={filters.recipientType}
                onStatusChange={handleStatusChange}
                onRecipientTypeChange={handleRecipientTypeChange}
              />
            </div>
          )}
        </div>

        {/* Results Header */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {consents.length} of {total} consent {total === 1 ? "record" : "records"}
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
        ) : consents.length === 0 ? (
          <EmptyConsentState
            isFiltered={isFiltered}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {consents.map((consent) => (
              <ConsentCard
                key={consent.id}
                consent={consent}
                onApprove={approveConsent}
                onReject={rejectConsent}
                onRevoke={revokeConsent}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
