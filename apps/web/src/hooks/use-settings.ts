"use client";

/**
 * useSettings — client hook for fetching user profile settings and updating account details.
 */

import * as React from "react";
import type { UserSettings, UpdateSettingsInput } from "@/types/settings.ts";

interface SettingsState {
  isLoading: boolean;
  settings: UserSettings | null;
  error: string | null;
}

export function useSettings() {
  const [state, setState] = React.useState<SettingsState>({
    isLoading: true,
    settings: null,
    error: null,
  });

  const load = React.useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Failed to load settings");
      }

      const json = (await res.json()) as { data: UserSettings };
      const raw = json.data;

      const settings: UserSettings = {
        ...raw,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
        ...(raw.sessionIssuedAt ? { sessionIssuedAt: new Date(raw.sessionIssuedAt) } : {}),
        ...(raw.sessionExpiresAt ? { sessionExpiresAt: new Date(raw.sessionExpiresAt) } : {}),
      };

      setState({
        isLoading: false,
        settings,
        error: null,
      });
    } catch (err) {
      setState({
        isLoading: false,
        settings: null,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const refresh = React.useCallback(() => {
    void load();
  }, [load]);

  const updateSettings = React.useCallback(
    async (input: UpdateSettingsInput): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const json = (await res.json()) as { error?: { message?: string } };
          return {
            success: false,
            error: json.error?.message ?? "Failed to update settings",
          };
        }

        const json = (await res.json()) as { data: UserSettings };
        const raw = json.data;

        setState({
          isLoading: false,
          settings: {
            ...raw,
            createdAt: new Date(raw.createdAt),
            updatedAt: new Date(raw.updatedAt),
            ...(raw.sessionIssuedAt ? { sessionIssuedAt: new Date(raw.sessionIssuedAt) } : {}),
            ...(raw.sessionExpiresAt ? { sessionExpiresAt: new Date(raw.sessionExpiresAt) } : {}),
          },
          error: null,
        });

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "An unexpected error occurred",
        };
      }
    },
    []
  );

  return {
    ...state,
    updateSettings,
    refresh,
  };
}
