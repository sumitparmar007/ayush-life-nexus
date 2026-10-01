"use client";

/**
 * useMedications — client hook for medications list page.
 *
 * Mirrors the useHealthRecords pattern: fetch → parse → expose
 * { isLoading, medications, total, error, refresh, filters, updateFilters }.
 */

import * as React from "react";
import type {
  MedicationListItem,
  MedicationFilters,
} from "@/types/medications.ts";

interface MedicationsState {
  isLoading: boolean;
  medications: MedicationListItem[];
  total: number;
  error: string | null;
}

const EMPTY_FILTERS: MedicationFilters = {};

export function useMedications() {
  const [filters, setFilters] = React.useState<MedicationFilters>(EMPTY_FILTERS);
  const [state, setState] = React.useState<MedicationsState>({
    isLoading: true,
    medications: [],
    total: 0,
    error: null,
  });

  const load = React.useCallback(async (activeFilters: MedicationFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (activeFilters.search) params.set("search", activeFilters.search);
      if (activeFilters.status) params.set("status", activeFilters.status);
      if (activeFilters.sortBy) params.set("sortBy", activeFilters.sortBy);
      if (activeFilters.sortOrder) params.set("sortOrder", activeFilters.sortOrder);

      const qs = params.toString();
      const url = `/api/medications${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to load medications");
      }

      const json = (await res.json()) as {
        data: {
          medications: MedicationListItem[];
          total: number;
          filters: MedicationFilters;
        };
      };

      // Hydrate Date objects
      const medications = json.data.medications.map((m) => ({
        ...m,
        createdAt: new Date(m.createdAt),
        ...(m.startDate ? { startDate: new Date(m.startDate) } : {}),
        ...(m.endDate ? { endDate: new Date(m.endDate) } : {}),
      }));

      setState({
        isLoading: false,
        medications,
        total: json.data.total,
        error: null,
      });
    } catch (err) {
      setState({
        isLoading: false,
        medications: [],
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
    (patch: Partial<MedicationFilters>) => {
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
