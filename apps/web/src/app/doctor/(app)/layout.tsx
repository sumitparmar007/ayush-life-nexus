/**
 * Protected Doctor layout — server component.
 *
 * Mirrors the Patient (app)/layout.tsx but enforces role === "DOCTOR".
 * Uses the same cookie, JWT, and session infrastructure.
 *
 * Patients and unauthenticated users are redirected away.
 * This layout NEVER weakens Patient protection — it is entirely separate.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { AuthProvider } from "@/contexts/auth-context.tsx";
import { DoctorDashboardShell } from "@/components/layout/doctor-dashboard-shell.tsx";
import type { StoredSession, StoredUser } from "@/lib/store.ts";
import type { SerializableUser } from "@/contexts/auth-context.tsx";

export default async function DoctorAppLayout({ children }: { children: React.ReactNode }) {
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

  // Not authenticated → login
  if (!session || !user) {
    redirect("/auth/login");
  }

  // Authenticated but NOT a Doctor → redirect to Patient dashboard
  if (user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  // Serialize Date objects to ISO strings for the client boundary
  const serializableUser: SerializableUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  const userProfile = {
    name: user.displayName || "Doctor",
    email: user.email || `${user.nexusId.slice(6, 14)}@nexus.in`,
    role: user.role,
  };

  return (
    <AuthProvider initialSession={session} initialUser={serializableUser}>
      <DoctorDashboardShell user={userProfile}>
        {children}
      </DoctorDashboardShell>
    </AuthProvider>
  );
}
