/**
 * Activity Log single activity endpoint.
 *
 * GET   /api/activity/[id]   — fetch single activity details
 * PATCH /api/activity/[id]   — mark as read (isRead: true)
 *
 * Note: Historical events are immutable. Deletion/editing of audit events is disabled.
 */

import { type NextRequest } from "next/server";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { getActivity, markActivityRead } from "@/lib/activity-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const activity = await getActivity(id, auth.user.nexusId);
  if (!activity) return err("NOT_FOUND", "Activity event not found", 404);

  return ok(activity);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const success = await markActivityRead(id, auth.user.nexusId);
    if (!success) return err("NOT_FOUND", "Activity event not found", 404);

    return ok({ isRead: true });
  } catch (error) {
    return fromError(error);
  }
}
