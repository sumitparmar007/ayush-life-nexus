"use client";

/**
 * useHealthRecords — client hook for health records list page.
 *
 * Mirrors the useDashboard pattern: fetch → parse → expose
 * { isLoading, records, total, error, refresh, filters, updateFilters }.
 */

import * as React from "react";
import type {
  HealthRecordListItem,
  HealthRecordFilters,
} from "@/types/health-records.ts";

interface HealthRecordsState {
  isLoading: boolean;
  records: HealthRecordListItem[];
  total: number;
  error: string | null;
}

const EMPTY_FILTERS: HealthRecordFilters = {};

export function useHealthRecords() {
  const [filters, setFilters] = React.useState<HealthRecordFilters>(EMPTY_FILTERS);
  const [state, setState] = React.useState<HealthRecordsState>({
    isLoading: true,
    records: [],
    total: 0,
    error: null,
  });

  const load = React.useCallback(async (activeFilters: HealthRecordFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (activeFilters.search) params.set("search", activeFilters.search);
      if (activeFilters.category) params.set("category", activeFilters.category);
      if (activeFilters.sortBy) params.set("sortBy", activeFilters.sortBy);
      if (activeFilters.sortOrder) params.set("sortOrder", activeFilters.sortOrder);

      const qs = params.toString();
      const url = `/api/records${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to load records");
      }

      const json = (await res.json()) as {
        data: {
          records: HealthRecordListItem[];
          total: number;
          filters: HealthRecordFilters;
        };
      };

      // Hydrate Date objects
      const records = json.data.records.map((r) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        ...(r.issuedDate ? { issuedDate: new Date(r.issuedDate) } : {}),
      }));

      setState({
        isLoading: false,
        records,
        total: json.data.total,
        error: null,
      });
    } catch (err) {
      setState({
        isLoading: false,
        records: [],
        total: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  // Reload when filters change
  React.useEffect(() => {
    void load(filters);
  }, [load, filters]);

  const refresh = React.useCallback(() => {
    void load(filters);
  }, [load, filters]);

  /** Merge partial filter updates into the current filters. */
  const updateFilters = React.useCallback(
    (patch: Partial<HealthRecordFilters>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  return {
    ...state,
    filters,
    updateFilters,
    refresh,
  };
}
