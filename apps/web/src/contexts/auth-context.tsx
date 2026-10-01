
"use client";

/**
 * AuthContext — display layer only.
 *
 * The server layout is the source of truth. This context receives
 * initialSession and initialUser from the server component and exposes
 * them to client components. It never reconstructs sessions from cookies
 * or makes auth decisions — it only caches what the server already verified.
 *
 * logout() clears the server cookie via API then forces a full navigation
 * to /auth/login so the server layout re-executes with no cookie.
 */

import * as React from "react";
import type { StoredSession } from "@/lib/store.ts";

/**
 * Serializable version of StoredUser — Date fields are converted to ISO
 * strings so they can cross the Server → Client component boundary.
 */
export interface SerializableUser {
  nexusId: string;
  phoneHash: string;
  role: "PATIENT" | "CAREGIVER" | "ADMIN" | "DOCTOR";
  trustLevel: 1 | 2 | 3 | 4 | 5;
  authMode: "MODE_A" | "MODE_B";
  abhaLinked: boolean;
  abhaId?: string | undefined;
  displayName?: string | undefined;
  email?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextValue {
  session: StoredSession;
  user: SerializableUser;
  logout: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  initialSession: StoredSession;
  initialUser: SerializableUser;
}

export function AuthProvider({ children, initialSession, initialUser }: AuthProviderProps) {
  const logout = React.useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Full navigation so server layout re-runs with no cookie
      window.location.href = "/auth/login";
    }
  }, []);

  const refresh = React.useCallback(() => {
    // Full navigation to re-run the server layout and re-read the cookie
    window.location.reload();
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ session: initialSession, user: initialUser, logout, refresh }),
    [initialSession, initialUser, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider (a protected route)");
  return ctx;
}

