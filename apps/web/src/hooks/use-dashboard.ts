"use client";

import * as React from "react";
import type { DashboardData } from "@/types/dashboard.ts";

interface DashboardState {
  isLoading: boolean;
  data: DashboardData | null;
  error: string | null;
}

export function useDashboard() {
  const [state, setState] = React.useState<DashboardState>({
    isLoading: true,
    data: null,
    error: null,
  });

  const load = React.useCallback(async () => {
    setState({ isLoading: true, data: null, error: null });
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to load dashboard");
      }
      const json = await res.json() as { data: DashboardData };
      const raw = json.data;
      const data: DashboardData = {
        ...raw,
        fetchedAt: new Date(raw.fetchedAt),
        profile: {
          ...raw.profile,
          lastLoginAt: raw.profile.lastLoginAt ? new Date(raw.profile.lastLoginAt) : null,
          memberSince: new Date(raw.profile.memberSince),
        },
        recentActivity: raw.recentActivity.map((a) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        })),
        upcomingTasks: raw.upcomingTasks.map((t) => ({
          ...t,
          ...(t.dueDate ? { dueDate: new Date(t.dueDate) } : {}),
        })),
      };
      setState({ isLoading: false, data, error: null });
    } catch (err) {
      setState({ isLoading: false, data: null, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  return { ...state, refresh: load };
}
