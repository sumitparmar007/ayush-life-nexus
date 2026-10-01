/**
 * Root page "/" — immediately redirects based on auth state.
 * This is a server component; it reads the cookie directly.
 * No client-side redirect logic, no router.push, no flash.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const sessionId = await verifySessionJwt(token);
    if (sessionId) {
      const session = findSession(sessionId);
      if (session) {
        const user = findUserById(session.nexusId);
        if (user?.role === "DOCTOR") {
          redirect("/doctor/dashboard");
        }
        redirect("/dashboard");
      }
    }
  }

  redirect("/auth/login");
}
