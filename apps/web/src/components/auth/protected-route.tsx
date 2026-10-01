"use client";

/**
 * ProtectedRoute is now a thin wrapper — real protection happens server-side
 * in (app)/layout.tsx. This component exists only to wrap content that needs
 * the AuthContext (useAuth()) available, which is already guaranteed by the
 * server layout having mounted AuthProvider before rendering children.
 *
 * There is no isLoading / isAuthenticated state here because the server
 * layout already redirected unauthenticated users before this renders.
 */

import * as React from "react";
import { useAuth } from "@/contexts/auth-context.tsx";

interface ProtectedRouteProps {
  children: React.ReactNode;
  minTrustLevel?: number;
  /** Shown while the component checks trust level — extremely brief. */
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, minTrustLevel, fallback }: ProtectedRouteProps) {
  const { session } = useAuth();

  if (minTrustLevel !== undefined && session.trustLevel < minTrustLevel) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
