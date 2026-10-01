import { type NextRequest } from "next/server";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { fetchDashboardData } from "@/lib/dashboard-service.ts";
import { ok, err } from "@/lib/api-response.ts";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return err("UNAUTHORIZED", "No session", 401);

  const sessionId = await verifySessionJwt(token);
  if (!sessionId) return err("INVALID_TOKEN", "Invalid token", 401);

  const session = findSession(sessionId);
  if (!session) return err("SESSION_NOT_FOUND", "Session expired", 401);

  const user = findUserById(session.nexusId);
  if (!user) return err("USER_NOT_FOUND", "User not found", 401);

  const data = await fetchDashboardData(user.nexusId);
  return ok(data);
}
