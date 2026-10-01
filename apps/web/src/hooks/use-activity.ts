"use client";

/**
 * useActivity — client hook for Activity Log events stream and read tracking.
 */

import * as React from "react";
import type { ActivityItem, ActivityFilters } from "@/types/activity.ts";

interface ActivityState {
  isLoading: boolean;
  activities: ActivityItem[];
  total: number;
  unreadCount: number;
  error: string | null;
}

const EMPTY_FILTERS: ActivityFilters = {};

export function useActivity() {
  const [filters, setFilters] = React.useState<ActivityFilters>(EMPTY_FILTERS);
  const [state, setState] = React.useState<ActivityState>({
    isLoading: true,
    activities: [],
    total: 0,
    unreadCount: 0,
    error: null,
  });

  const load = React.useCallback(async (activeFilters: ActivityFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (activeFilters.search) params.set("search", activeFilters.search);
      if (activeFilters.type) params.set("type", activeFilters.type);
      if (activeFilters.unreadOnly) params.set("unreadOnly", "true");

      const qs = params.toString();
      const url = `/api/activity${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to load activity log");
      }

      const json = (await res.json()) as {
        data: {
          activities: ActivityItem[];
          total: number;
          unreadCount: number;
          filters: ActivityFilters;
        };
      };

      // Hydrate Date objects
      const activities = json.data.activities.map((a) => ({
        ...a,
        timestamp: new Date(a.timestamp),
      }));

      setState({
        isLoading: false,
        activities,
        total: json.data.total,
        unreadCount: json.data.unreadCount,
        error: null,
      });
    } catch (err) {
      setState({
        isLoading: false,
        activities: [],
        total: 0,
        unreadCount: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  // Reload on filter changes
  React.useEffect(() => {
    void load(filters);
  }, [load, filters]);

  const refresh = React.useCallback(() => {
    void load(filters);
  }, [load, filters]);

  /** Merge partial filter updates */
  const updateFilters = React.useCallback(
    (patch: Partial<ActivityFilters>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  /** Mark single activity as read */
  const markAsRead = React.useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/activity/${id}`, {
          method: "PATCH",
        });
        if (res.ok) {
          // Optimistically update local state
          setState((prev) => ({
            ...prev,
            activities: prev.activities.map((a) =>
              a.id === id ? { ...a, isRead: true } : a
            ),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          }));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  /** Mark all activities as read */
  const markAllAsRead = React.useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/activity/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setState((prev) => ({
          ...prev,
          activities: prev.activities.map((a) => ({ ...a, isRead: true })),
          unreadCount: 0,
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return {
    ...state,
    filters,
    updateFilters,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
