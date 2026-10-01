"use client";

/**
 * useLabs — client hook for lab results list and state management.
 *
 * Mirrors the useMedications / useHealthRecords pattern:
 * fetch → hydrate dates → expose { isLoading, labs, total, error, refresh, filters, updateFilters }.
 */

import * as React from "react";
import type { LabListItem, LabFilters } from "@/types/labs.ts";

interface LabsState {
  isLoading: boolean;
  labs: LabListItem[];
  total: number;
  error: string | null;
}

const EMPTY_FILTERS: LabFilters = {};

export function useLabs() {
  const [filters, setFilters] = React.useState<LabFilters>(EMPTY_FILTERS);
  const [state, setState] = React.useState<LabsState>({
    isLoading: true,
    labs: [],
    total: 0,
    error: null,
  });

  const load = React.useCallback(async (activeFilters: LabFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (activeFilters.search) params.set("search", activeFilters.search);
      if (activeFilters.category) params.set("category", activeFilters.category);
      if (activeFilters.status) params.set("status", activeFilters.status);
      if (activeFilters.sortBy) params.set("sortBy", activeFilters.sortBy);
      if (activeFilters.sortOrder) params.set("sortOrder", activeFilters.sortOrder);

      const qs = params.toString();
      const url = `/api/labs${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to load lab results");
      }

      const json = (await res.json()) as {
        data: {
          labs: LabListItem[];
          total: number;
          filters: LabFilters;
        };
      };

      // Hydrate Date objects
      const labs = json.data.labs.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        ...(item.collectedAt ? { collectedAt: new Date(item.collectedAt) } : {}),
        ...(item.resultDate ? { resultDate: new Date(item.resultDate) } : {}),
      }));

      setState({
        isLoading: false,
        labs,
        total: json.data.total,
        error: null,
      });
    } catch (err) {
      setState({
        isLoading: false,
        labs: [],
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
    (patch: Partial<LabFilters>) => {
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
