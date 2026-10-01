/**
 * Doctor Consents Management API
 *
 * GET  /api/doctor/consents — List consent requests and authorizations initiated by the doctor
 * POST /api/doctor/consents — Send a new access request to a patient (creates PENDING_APPROVAL)
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import {
  listConsentsForDoctor,
  createDoctorConsentRequest,
} from "@/lib/consent-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import {
  ConsentStatus,
  ConsentPurpose,
  ConsentDataScope,
  ConsentPermission,
  type ConsentFilters,
} from "@/types/consent.ts";

async function authenticateDoctor(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return { error: err("UNAUTHORIZED", "No session cookie", 401) };

  const sessionId = await verifySessionJwt(token);
  if (!sessionId) return { error: err("INVALID_TOKEN", "Invalid session token", 401) };

  const session = findSession(sessionId);
  if (!session) return { error: err("SESSION_NOT_FOUND", "Session expired", 401) };

  const user = findUserById(session.nexusId);
  if (!user) return { error: err("USER_NOT_FOUND", "User not found", 401) };

  if (user.role !== "DOCTOR") {
    return { error: err("FORBIDDEN", "Only doctors can access doctor consent operations", 403) };
  }

  return { user };
}

// ─── GET /api/doctor/consents ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await authenticateDoctor(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);

  const filters: ConsentFilters = {};
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  if (status) filters.status = status as ConsentStatus;
  if (search) filters.search = search;
  if (sortBy) filters.sortBy = sortBy as "recipientName" | "expiresAt" | "createdAt" | "status";
  if (sortOrder) filters.sortOrder = sortOrder as "asc" | "desc";

  const data = await listConsentsForDoctor(auth.user.nexusId, filters);
  return ok(data);
}

// ─── POST /api/doctor/consents ────────────────────────────────────────────────

const createRequestSchema = z.object({
  patientNexusId: z
    .string()
    .min(1, "Target patient Nexus ID is required")
    .startsWith("nexus_", "Invalid Nexus ID format"),
  dataScopes: z
    .array(z.nativeEnum(ConsentDataScope))
    .min(1, "At least one data category scope must be requested"),
  permission: z.nativeEnum(ConsentPermission).optional().default(ConsentPermission.VIEW_ONLY),
  purpose: z.nativeEnum(ConsentPurpose).optional().default(ConsentPurpose.DIRECT_CARE),
  expiresAt: z.string().min(1, "Expiry date is required"),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateDoctor(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = createRequestSchema.parse(body);

    const result = await createDoctorConsentRequest(auth.user.nexusId, {
      patientNexusId: parsed.patientNexusId.trim(),
      dataScopes: parsed.dataScopes,
      permission: parsed.permission,
      purpose: parsed.purpose,
      expiresAt: parsed.expiresAt,
      ...(parsed.notes ? { notes: parsed.notes } : {}),
    });

    if (result.error) {
      return err(result.code, result.error, result.status);
    }

    return ok(result.consent, 201);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}
