/**
 * Consent API — list + create.
 *
 * GET  /api/consent?status=...&recipientType=...&search=...&sortBy=...&sortOrder=...
 * POST /api/consent  { recipientName, recipientType, purpose, dataScopes, permission, expiresAt, ... }
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import {
  listConsents,
  createConsent,
} from "@/lib/consent-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import {
  ConsentStatus,
  ConsentRecipientType,
  ConsentPurpose,
  ConsentDataScope,
  ConsentPermission,
  type ConsentFilters,
  type CreateConsentInput,
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

// ─── GET /api/consent ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);

  const filters: ConsentFilters = {};
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const recipientType = searchParams.get("recipientType");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  if (search) filters.search = search;
  if (status) filters.status = status as ConsentStatus;
  if (recipientType) filters.recipientType = recipientType as ConsentRecipientType;
  if (sortBy) filters.sortBy = sortBy as "recipientName" | "expiresAt" | "createdAt" | "status";
  if (sortOrder) filters.sortOrder = sortOrder as "asc" | "desc";

  const data = await listConsents(auth.user.nexusId, filters);
  return ok(data);
}

// ─── POST /api/consent ────────────────────────────────────────────────────────

const createSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required").max(200),
  recipientType: z.nativeEnum(ConsentRecipientType),
  organizationName: z.string().max(200).optional(),
  purpose: z.nativeEnum(ConsentPurpose),
  dataScopes: z
    .array(z.nativeEnum(ConsentDataScope))
    .min(1, "At least one data category must be selected"),
  permission: z.nativeEnum(ConsentPermission),
  status: z.nativeEnum(ConsentStatus).optional(),
  expiresAt: z.string().min(1, "Expiry date is required"),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const input: CreateConsentInput = {
      recipientName: parsed.recipientName,
      recipientType: parsed.recipientType,
      purpose: parsed.purpose,
      dataScopes: parsed.dataScopes,
      permission: parsed.permission,
      expiresAt: parsed.expiresAt,
    };

    if (parsed.organizationName) input.organizationName = parsed.organizationName;
    if (parsed.status) input.status = parsed.status;
    if (parsed.notes) input.notes = parsed.notes;

    const consent = await createConsent(auth.user.nexusId, input);
    return ok(consent, 201);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}
