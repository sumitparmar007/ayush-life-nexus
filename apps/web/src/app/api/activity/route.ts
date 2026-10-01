/**
 * Activity Log API — list and filter user activities.
 *
 * GET /api/activity
 *
 * Query params:
 * - search?: string
 * - type?: ActivityType
 * - unreadOnly?: boolean
 */

import { type NextRequest } from "next/server";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { listActivities } from "@/lib/activity-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import { ActivityType, type ActivityFilters } from "@/types/activity.ts";

async function authenticateRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return { error: err("UNAUTHORIZED", "No session", 401) };

  const sessionId = await verifySessionJwt(token);
  if (!sessionId) return { error: err("INVALID_TOKEN", "Invalid token", 401) };

  const session = findSession(sessionId);
  if (!session) return { error: err("SESSION_NOT_FOUND", "Session expired", 401) };

  const user = findUserById(session.nexusId);
  if (!user) return { error: err("USER_NOT_FOUND", "User not found", 401) };

  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const typeParam = searchParams.get("type");
    const unreadOnlyParam = searchParams.get("unreadOnly");

    const filters: ActivityFilters = {};
    if (search) filters.search = search;
    if (typeParam && Object.values(ActivityType).includes(typeParam as ActivityType)) {
      filters.type = typeParam as ActivityType;
    }
    if (unreadOnlyParam === "true") {
      filters.unreadOnly = true;
    }

    const result = await listActivities(auth.user.nexusId, filters);
    return ok(result);
  } catch (error) {
    return fromError(error);
  }
}
