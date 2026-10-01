"use client";

/**
 * useInsurance — client hook for insurance policies list and state management.
 *
 * Mirrors the useMedications / useLabs / useHealthRecords pattern:
 * fetch → hydrate dates → expose { isLoading, policies, total, error, refresh, filters, updateFilters }.
 */

import * as React from "react";
import type { InsuranceListItem, InsuranceFilters } from "@/types/insurance.ts";

interface InsuranceState {
  isLoading: boolean;
  policies: InsuranceListItem[];
  total: number;
  error: string | null;
}

const EMPTY_FILTERS: InsuranceFilters = {};

export function useInsurance() {
  const [filters, setFilters] = React.useState<InsuranceFilters>(EMPTY_FILTERS);
  const [state, setState] = React.useState<InsuranceState>({
    isLoading: true,
    policies: [],
    total: 0,
    error: null,
  });

  const load = React.useCallback(async (activeFilters: InsuranceFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (activeFilters.search) params.set("search", activeFilters.search);
      if (activeFilters.status) params.set("status", activeFilters.status);
      if (activeFilters.type) params.set("type", activeFilters.type);
      if (activeFilters.sortBy) params.set("sortBy", activeFilters.sortBy);
      if (activeFilters.sortOrder) params.set("sortOrder", activeFilters.sortOrder);

      const qs = params.toString();
      const url = `/api/insurance${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to load insurance policies");
      }

      const json = (await res.json()) as {
        data: {
          policies: InsuranceListItem[];
          total: number;
          filters: InsuranceFilters;
        };
      };

      // Hydrate Date objects
      const policies = json.data.policies.map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        expiryDate: new Date(p.expiryDate),
        ...(p.startDate ? { startDate: new Date(p.startDate) } : {}),
      }));

      setState({
        isLoading: false,
        policies,
        total: json.data.total,
        error: null,
      });
    } catch (err) {
      setState({
        isLoading: false,
        policies: [],
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
    (patch: Partial<InsuranceFilters>) => {
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
