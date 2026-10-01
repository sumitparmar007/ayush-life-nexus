/**
 * Medications API — list + create.
 *
 * GET  /api/medications?status=...&search=...&sortBy=...&sortOrder=...
 * POST /api/medications  { name, dosage, dosageUnit, frequency, route, ... }
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { listMedications, createMedication } from "@/lib/medications-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import {
  MedicationStatus,
  MedicationFrequency,
  MedicationRoute,
  type MedicationFilters,
  type CreateMedicationInput,
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

// ─── GET /api/medications ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);

  const filters: MedicationFilters = {};
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  if (search) filters.search = search;
  if (status) filters.status = status as MedicationStatus;
  if (sortBy) filters.sortBy = sortBy as "name" | "createdAt" | "startDate";
  if (sortOrder) filters.sortOrder = sortOrder as "asc" | "desc";

  const data = await listMedications(auth.user.nexusId, filters);
  return ok(data);
}

// ─── POST /api/medications ────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1, "Medication name is required").max(200),
  dosage: z.string().min(1, "Dosage amount is required").max(50),
  dosageUnit: z.string().min(1, "Dosage unit is required").max(50),
  frequency: z.nativeEnum(MedicationFrequency),
  route: z.nativeEnum(MedicationRoute),
  instructions: z.string().max(1000).optional(),
  prescribedBy: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  refillsRemaining: z.number().int().min(0).optional(),
  prescriptionRecordId: z.string().optional(),
  status: z.nativeEnum(MedicationStatus).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const input: CreateMedicationInput = {
      name: parsed.name,
      dosage: parsed.dosage,
      dosageUnit: parsed.dosageUnit,
      frequency: parsed.frequency,
      route: parsed.route,
    };

    if (parsed.instructions) input.instructions = parsed.instructions;
    if (parsed.prescribedBy) input.prescribedBy = parsed.prescribedBy;
    if (parsed.startDate) input.startDate = parsed.startDate;
    if (parsed.endDate) input.endDate = parsed.endDate;
    if (parsed.refillsRemaining !== undefined) input.refillsRemaining = parsed.refillsRemaining;
    if (parsed.prescriptionRecordId) input.prescriptionRecordId = parsed.prescriptionRecordId;
    if (parsed.status) input.status = parsed.status;

    const medication = await createMedication(auth.user.nexusId, input);
    return ok(medication, 201);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}
