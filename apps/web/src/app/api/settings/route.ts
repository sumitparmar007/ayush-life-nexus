/**
 * Settings & Account Management API
 *
 * GET   /api/settings — fetch user profile & safe session metadata
 * PATCH /api/settings — update user profile (displayName, email, abhaId)
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { getUserSettings, updateUserSettings } from "@/lib/settings-service.ts";
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

  return { user, session };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const settings = await getUserSettings(
    auth.user.nexusId,
    auth.session.sessionId
  );
  if (!settings) return err("NOT_FOUND", "User profile not found", 404);

  return ok(settings);
}

const updateSchema = z.object({
  displayName: z.string().min(1, "Name cannot be empty").max(100).optional().nullable(),
  email: z.string().email("Invalid email address format").max(200).optional().nullable(),
  abhaId: z.string().max(50).optional().nullable(),
});

export async function PATCH(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const body: unknown = await request.json();
    const parsed = updateSchema.parse(body);

    const updated = await updateUserSettings(
      auth.user.nexusId,
      {
        displayName: parsed.displayName || undefined,
        email: parsed.email || undefined,
        abhaId: parsed.abhaId || undefined,
      },
      auth.session.sessionId
    );

    if (!updated) return err("NOT_FOUND", "User profile not found", 404);

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}
