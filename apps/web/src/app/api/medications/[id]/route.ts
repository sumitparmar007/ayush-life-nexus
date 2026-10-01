/**
 * Medications API — single medication operations.
 *
 * GET    /api/medications/[id]   — fetch single medication
 * PATCH  /api/medications/[id]   — update medication
 * DELETE /api/medications/[id]   — soft delete medication
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import {
  getMedication,
  updateMedication,
  deleteMedication,
} from "@/lib/medications-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import {
  MedicationStatus,
  MedicationFrequency,
  MedicationRoute,
  type UpdateMedicationInput,
} from "@/types/medications.ts";

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

// ─── GET /api/medications/[id] ────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const medication = await getMedication(id, auth.user.nexusId);
  if (!medication) return err("NOT_FOUND", "Medication not found", 404);

  return ok(medication);
}

// ─── PATCH /api/medications/[id] ──────────────────────────────────────────────

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  dosage: z.string().min(1).max(50).optional(),
  dosageUnit: z.string().min(1).max(50).optional(),
  frequency: z.nativeEnum(MedicationFrequency).optional(),
  route: z.nativeEnum(MedicationRoute).optional(),
  instructions: z.string().max(1000).optional().nullable(),
  prescribedBy: z.string().max(200).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  refillsRemaining: z.number().int().min(0).optional().nullable(),
  prescriptionRecordId: z.string().optional().nullable(),
  status: z.nativeEnum(MedicationStatus).optional(),
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

    const input: UpdateMedicationInput = {};
    if (parsed.name !== undefined) input.name = parsed.name;
    if (parsed.dosage !== undefined) input.dosage = parsed.dosage;
    if (parsed.dosageUnit !== undefined) input.dosageUnit = parsed.dosageUnit;
    if (parsed.frequency !== undefined) input.frequency = parsed.frequency;
    if (parsed.route !== undefined) input.route = parsed.route;
    if (parsed.instructions !== undefined) input.instructions = parsed.instructions || undefined;
    if (parsed.prescribedBy !== undefined) input.prescribedBy = parsed.prescribedBy || undefined;
    if (parsed.startDate !== undefined) input.startDate = parsed.startDate || undefined;
    if (parsed.endDate !== undefined) input.endDate = parsed.endDate || undefined;
    if (parsed.refillsRemaining !== undefined) {
      input.refillsRemaining = parsed.refillsRemaining === null ? undefined : parsed.refillsRemaining;
    }
    if (parsed.prescriptionRecordId !== undefined) {
      input.prescriptionRecordId = parsed.prescriptionRecordId || undefined;
    }
    if (parsed.status !== undefined) input.status = parsed.status;

    const medication = await updateMedication(id, auth.user.nexusId, input);
    if (!medication) return err("NOT_FOUND", "Medication not found or not owned by you", 404);

    return ok(medication);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}

// ─── DELETE /api/medications/[id] ─────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const deleted = await deleteMedication(id, auth.user.nexusId);
  if (!deleted) return err("NOT_FOUND", "Medication not found or not owned by you", 404);

  return ok({ deleted: true });
}
