/**
 * Health Records API — single record operations.
 *
 * GET    /api/records/[id]   — fetch single record
 * DELETE /api/records/[id]   — delete record
 */

import { type NextRequest } from "next/server";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { getRecord, deleteRecord } from "@/lib/health-records-service.ts";
import { ok, err } from "@/lib/api-response.ts";

// ─── Auth helper ──────────────────────────────────────────────────────────────

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

// ─── GET /api/records/[id] ────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const record = await getRecord(id, auth.user.nexusId);
  if (!record) return err("NOT_FOUND", "Record not found", 404);

  return ok(record);
}

// ─── DELETE /api/records/[id] ─────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const deleted = await deleteRecord(id, auth.user.nexusId);
  if (!deleted) return err("NOT_FOUND", "Record not found or not owned by you", 404);

  return ok({ deleted: true });
}
