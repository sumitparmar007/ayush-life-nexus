"use client";

/**
 * useConsent — client hook for consent records list and lifecycle operations.
 *
 * Mirrors the useInsurance / useLabs / useMedications / useHealthRecords pattern:
 * fetch → hydrate dates → expose { isLoading, consents, total, error, refresh, filters, updateFilters, approveConsent, revokeConsent }.
 */

import * as React from "react";
import type { ConsentListItem, ConsentFilters } from "@/types/consent.ts";

interface ConsentState {
  isLoading: boolean;
  consents: ConsentListItem[];
  total: number;
  error: string | null;
}

const EMPTY_FILTERS: ConsentFilters = {};

export function useConsent() {
  const [filters, setFilters] = React.useState<ConsentFilters>(EMPTY_FILTERS);
  const [state, setState] = React.useState<ConsentState>({
    isLoading: true,
    consents: [],
    total: 0,
    error: null,
  });

  const load = React.useCallback(async (activeFilters: ConsentFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (activeFilters.search) params.set("search", activeFilters.search);
      if (activeFilters.status) params.set("status", activeFilters.status);
      if (activeFilters.recipientType) params.set("recipientType", activeFilters.recipientType);
      if (activeFilters.sortBy) params.set("sortBy", activeFilters.sortBy);
      if (activeFilters.sortOrder) params.set("sortOrder", activeFilters.sortOrder);

      const qs = params.toString();
      const url = `/api/consent${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to load consents");
      }

      const json = (await res.json()) as {
        data: {
          consents: ConsentListItem[];
          total: number;
          filters: ConsentFilters;
        };
      };

      // Hydrate Date objects
      const consents = json.data.consents.map((c) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        expiresAt: new Date(c.expiresAt),
        ...(c.grantedAt ? { grantedAt: new Date(c.grantedAt) } : {}),
        ...(c.revokedAt ? { revokedAt: new Date(c.revokedAt) } : {}),
      }));

      setState({
        isLoading: false,
        consents,
        total: json.data.total,
        error: null,
      });
    } catch (err) {
      setState({
        isLoading: false,
        consents: [],
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
    (patch: Partial<ConsentFilters>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  /** Approve a pending consent request */
  const approveConsent = React.useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/consent/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        });
        if (res.ok) {
          refresh();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [refresh]
  );

  /** Reject a pending consent request */
  const rejectConsent = React.useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/consent/${id}/reject`, {
          method: "POST",
        });
        if (res.ok) {
          refresh();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [refresh]
  );

  /** Revoke an active consent */
  const revokeConsent = React.useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/consent/${id}/revoke`, {
          method: "POST",
        });
        if (res.ok) {
          refresh();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [refresh]
  );

  return {
    ...state,
    filters,
    updateFilters,
    approveConsent,
    rejectConsent,
    revokeConsent,
    refresh,
  };
}
