/**
 * Protected app layout — server component.
 *
 * This is the SINGLE authentication checkpoint for all protected routes.
 * It reads the cookie, verifies the JWT, loads session + user from the
 * singleton store, and either redirects to login or renders children with
 * AuthProvider pre-populated from server state.
 *
 * No middleware, no client-side auth reconstruction, no redirect loops.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { AuthProvider } from "@/contexts/auth-context.tsx";
import { DashboardShell } from "@/components/layout/dashboard-shell.tsx";
import type { StoredSession, StoredUser } from "@/lib/store.ts";
import type { SerializableUser } from "@/contexts/auth-context.tsx";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  let session: StoredSession | null = null;
  let user: StoredUser | null = null;

  if (token) {
    const sessionId = await verifySessionJwt(token);
    if (sessionId) {
      session = findSession(sessionId);
      if (session) {
        user = findUserById(session.nexusId);
      }
    }
  }

  if (!session || !user) {
    redirect("/auth/login");
  }

  // Doctors must not access patient routes — redirect to doctor dashboard
  if (user.role === "DOCTOR") {
    redirect("/doctor/dashboard");
  }

  // Serialize Date objects to ISO strings for the client boundary
  const serializableUser: SerializableUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  const userProfile = {
    name: user.displayName || "Patient",
    email: user.email || `${user.nexusId.slice(6, 14)}@nexus.in`,
    role: user.role,
  };

  return (
    <AuthProvider initialSession={session} initialUser={serializableUser}>
      <DashboardShell user={userProfile}>
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
