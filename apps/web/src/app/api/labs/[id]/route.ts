/**
 * Lab Results API — single lab test operations.
 *
 * GET    /api/labs/[id]   — fetch single lab test
 * PATCH  /api/labs/[id]   — update lab test
 * DELETE /api/labs/[id]   — soft delete lab test
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import {
  getLabResult,
  updateLabResult,
  deleteLabResult,
} from "@/lib/labs-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import {
  LabCategory,
  LabResultStatus,
  type UpdateLabResultInput,
} from "@/types/labs.ts";

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

// ─── GET /api/labs/[id] ───────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const labResult = await getLabResult(id, auth.user.nexusId);
  if (!labResult) return err("NOT_FOUND", "Lab result not found", 404);

  return ok(labResult);
}

// ─── PATCH /api/labs/[id] ─────────────────────────────────────────────────────

const updateSchema = z.object({
  testName: z.string().min(1).max(200).optional(),
  category: z.nativeEnum(LabCategory).optional(),
  value: z.string().min(1).max(100).optional(),
  numericValue: z.number().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  referenceRangeMin: z.number().optional().nullable(),
  referenceRangeMax: z.number().optional().nullable(),
  referenceRangeText: z.string().max(100).optional().nullable(),
  status: z.nativeEnum(LabResultStatus).optional(),
  labName: z.string().max(200).optional().nullable(),
  collectedAt: z.string().optional().nullable(),
  resultDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  healthRecordId: z.string().optional().nullable(),
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

    const input: UpdateLabResultInput = {};
    if (parsed.testName !== undefined) input.testName = parsed.testName;
    if (parsed.category !== undefined) input.category = parsed.category;
    if (parsed.value !== undefined) input.value = parsed.value;
    if (parsed.numericValue !== undefined) {
      input.numericValue = parsed.numericValue === null ? undefined : parsed.numericValue;
    }
    if (parsed.unit !== undefined) input.unit = parsed.unit || undefined;
    if (parsed.referenceRangeMin !== undefined) {
      input.referenceRangeMin = parsed.referenceRangeMin === null ? undefined : parsed.referenceRangeMin;
    }
    if (parsed.referenceRangeMax !== undefined) {
      input.referenceRangeMax = parsed.referenceRangeMax === null ? undefined : parsed.referenceRangeMax;
    }
    if (parsed.referenceRangeText !== undefined) {
      input.referenceRangeText = parsed.referenceRangeText || undefined;
    }
    if (parsed.status !== undefined) input.status = parsed.status;
    if (parsed.labName !== undefined) input.labName = parsed.labName || undefined;
    if (parsed.collectedAt !== undefined) input.collectedAt = parsed.collectedAt || undefined;
    if (parsed.resultDate !== undefined) input.resultDate = parsed.resultDate || undefined;
    if (parsed.notes !== undefined) input.notes = parsed.notes || undefined;
    if (parsed.healthRecordId !== undefined) {
      input.healthRecordId = parsed.healthRecordId || undefined;
    }

    const labResult = await updateLabResult(id, auth.user.nexusId, input);
    if (!labResult) return err("NOT_FOUND", "Lab result not found or not owned by you", 404);

    return ok(labResult);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}

// ─── DELETE /api/labs/[id] ────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const deleted = await deleteLabResult(id, auth.user.nexusId);
  if (!deleted) return err("NOT_FOUND", "Lab result not found or not owned by you", 404);

  return ok({ deleted: true });
}
