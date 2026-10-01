/**
 * Consent API — single consent operations.
 *
 * GET    /api/consent/[id]   — fetch single consent
 * PATCH  /api/consent/[id]   — update consent (or approve/revoke)
 * DELETE /api/consent/[id]   — soft delete consent record
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import {
  getConsent,
  updateConsent,
  approveConsent,
  rejectConsent,
  revokeConsent,
  deleteConsent,
} from "@/lib/consent-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import {
  ConsentStatus,
  ConsentRecipientType,
  ConsentPurpose,
  ConsentDataScope,
  ConsentPermission,
  type UpdateConsentInput,
} from "@/types/consent.ts";

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

// ─── GET /api/consent/[id] ────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const consent = await getConsent(id, auth.user.nexusId);
  if (!consent) return err("NOT_FOUND", "Consent record not found", 404);

  return ok(consent);
}

// ─── PATCH /api/consent/[id] ──────────────────────────────────────────────────

const updateSchema = z.object({
  recipientNexusId: z.string().optional(),
  recipientName: z.string().min(1).max(200).optional(),
  recipientType: z.nativeEnum(ConsentRecipientType).optional(),
  organizationName: z.string().max(200).optional().nullable(),
  purpose: z.nativeEnum(ConsentPurpose).optional(),
  dataScopes: z.array(z.nativeEnum(ConsentDataScope)).min(1).optional(),
  permission: z.nativeEnum(ConsentPermission).optional(),
  status: z.nativeEnum(ConsentStatus).optional(),
  expiresAt: z.string().optional(),
  notes: z.string().max(1000).optional().nullable(),
  action: z.enum(["approve", "reject", "revoke"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    if (parsed.action === "approve") {
      const approved = await approveConsent(id, auth.user.nexusId);
      if (!approved) return err("NOT_FOUND", "Consent record not found or not owned by you", 404);
      return ok(approved);
    }

    if (parsed.action === "reject" || parsed.status === "REJECTED") {
      const rejected = await rejectConsent(id, auth.user.nexusId);
      if (!rejected) return err("NOT_FOUND", "Consent record not found or not owned by you", 404);
      return ok(rejected);
    }

    if (parsed.action === "revoke" || parsed.status === "REVOKED") {
      const revoked = await revokeConsent(id, auth.user.nexusId);
      if (!revoked) return err("NOT_FOUND", "Consent record not found or not owned by you", 404);
      return ok(revoked);
    }

    const input: UpdateConsentInput = {};
    if (parsed.recipientName !== undefined) input.recipientName = parsed.recipientName;
    if (parsed.recipientType !== undefined) input.recipientType = parsed.recipientType;
    if (parsed.organizationName !== undefined) {
      input.organizationName = parsed.organizationName || undefined;
    }
    if (parsed.purpose !== undefined) input.purpose = parsed.purpose;
    if (parsed.dataScopes !== undefined) input.dataScopes = parsed.dataScopes;
    if (parsed.permission !== undefined) input.permission = parsed.permission;
    if (parsed.status !== undefined) input.status = parsed.status;
    if (parsed.expiresAt !== undefined) input.expiresAt = parsed.expiresAt;
    if (parsed.notes !== undefined) input.notes = parsed.notes || undefined;

    const updated = await updateConsent(id, auth.user.nexusId, input);
    if (!updated) return err("NOT_FOUND", "Consent record not found or not owned by you", 404);

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}

// ─── DELETE /api/consent/[id] ─────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const deleted = await deleteConsent(id, auth.user.nexusId);
  if (!deleted) return err("NOT_FOUND", "Consent record not found or not owned by you", 404);

  return ok({ deleted: true });
}
