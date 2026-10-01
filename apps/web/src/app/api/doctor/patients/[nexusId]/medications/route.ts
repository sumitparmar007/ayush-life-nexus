/**
 * Doctor Patient Medications Access API (Read-Only) — Phase 11D
 *
 * GET /api/doctor/patients/[nexusId]/medications
 *
 * Requirements:
 * 1. Authenticated Doctor session only (derived strictly from server session cookie)
 * 2. Target patient validation
 * 3. Centralized authorization check via canDoctorAccessPatient() with PRESCRIPTIONS scope
 * 4. Read-only projection of target patient's non-deleted medications
 * 5. PATIENT_DATA_ACCESSED audit event logging on successful access
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { canDoctorAccessPatient } from "@/lib/doctor-authorization.ts";
import { listMedications, createDoctorPrescription } from "@/lib/medications-service.ts";
import { recordActivity } from "@/lib/activity-service.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";
import { ConsentDataScope } from "@/types/consent.ts";
import { ActivityType } from "@/types/activity.ts";
import {
  MedicationStatus,
  MedicationFrequency,
  MedicationRoute,
  type CreateMedicationInput,
} from "@/types/medications.ts";

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
    return { error: err("FORBIDDEN", "Only doctors can access clinical patient data", 403) };
  }

  return { user };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nexusId: string }> }
) {
  const auth = await authenticateDoctor(request);
  if ("error" in auth) return auth.error;

  const { nexusId: targetPatientNexusId } = await params;

  if (!targetPatientNexusId || !targetPatientNexusId.startsWith("nexus_")) {
    return err("INVALID_REQUEST", "Valid patient Nexus ID is required", 400);
  }

  // 1. Centralized Authorization Security Boundary
  const authResult = canDoctorAccessPatient(
    auth.user.nexusId,
    targetPatientNexusId,
    ConsentDataScope.PRESCRIPTIONS
  );

  if (!authResult.allowed) {
    const targetUser = findUserById(targetPatientNexusId);
    if (!targetUser || targetUser.role !== "PATIENT") {
      return err("PATIENT_NOT_FOUND", "Patient not found", 404);
    }
    return err("FORBIDDEN", authResult.reason || "Access denied by consent policy", 403);
  }

  // 2. Query parameters / filtering
  const { searchParams } = new URL(request.url);
  const filters: import("@/types/medications.ts").MedicationFilters = {};
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  if (search) filters.search = search;
  if (status) filters.status = status as typeof MedicationStatus[keyof typeof MedicationStatus];
  if (sortBy) filters.sortBy = sortBy as "createdAt" | "startDate" | "name";
  if (sortOrder) filters.sortOrder = sortOrder as "asc" | "desc";

  // 3. Read target patient's medications
  const data = await listMedications(targetPatientNexusId, filters);

  // 4. Log audit event on successful access
  const doctorName = auth.user.displayName || "Doctor";
  const formattedDoctorName = doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`;

  void recordActivity(targetPatientNexusId, {
    type: ActivityType.PATIENT_DATA_ACCESSED,
    title: "Medications Accessed",
    description: `${formattedDoctorName} accessed your medications.`,
    entityType: "medication",
  });

  const targetPatient = findUserById(targetPatientNexusId);
  const patientDisplayName = targetPatient?.displayName || "Patient";

  void recordActivity(auth.user.nexusId, {
    type: ActivityType.PATIENT_DATA_ACCESSED,
    title: "Patient Prescriptions Accessed",
    description: `Accessed prescriptions for ${patientDisplayName}.`,
    entityType: "medication",
  });

  return ok(data);
}

// ─── POST /api/doctor/patients/[nexusId]/medications (Phase 11E) ───────────────

const createPrescriptionSchema = z.object({
  name: z.string().min(1, "Medication name is required").max(200),
  dosage: z.string().min(1, "Dosage amount is required").max(50),
  dosageUnit: z.string().min(1, "Dosage unit is required").max(50),
  frequency: z.nativeEnum(MedicationFrequency),
  route: z.nativeEnum(MedicationRoute),
  instructions: z.string().max(1000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  refillsRemaining: z.number().int().min(0).optional(),
  prescriptionRecordId: z.string().optional(),
  status: z.nativeEnum(MedicationStatus).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nexusId: string }> }
) {
  const auth = await authenticateDoctor(request);
  if ("error" in auth) return auth.error;

  const { nexusId: targetPatientNexusId } = await params;

  if (!targetPatientNexusId || !targetPatientNexusId.startsWith("nexus_")) {
    return err("INVALID_REQUEST", "Valid patient Nexus ID is required", 400);
  }

  // 1. Centralized Authorization Security Boundary Check
  const authResult = canDoctorAccessPatient(
    auth.user.nexusId,
    targetPatientNexusId,
    ConsentDataScope.PRESCRIPTIONS
  );

  if (!authResult.allowed) {
    const targetUser = findUserById(targetPatientNexusId);
    if (!targetUser || targetUser.role !== "PATIENT") {
      return err("PATIENT_NOT_FOUND", "Patient not found", 404);
    }
    return err("FORBIDDEN", authResult.reason || "Access denied by consent policy", 403);
  }

  try {
    const body = await request.json();
    const parsed = createPrescriptionSchema.parse(body);

    const input: CreateMedicationInput = {
      name: parsed.name,
      dosage: parsed.dosage,
      dosageUnit: parsed.dosageUnit,
      frequency: parsed.frequency,
      route: parsed.route,
    };

    if (parsed.instructions) input.instructions = parsed.instructions;
    if (parsed.startDate) input.startDate = parsed.startDate;
    if (parsed.endDate) input.endDate = parsed.endDate;
    if (parsed.refillsRemaining !== undefined) input.refillsRemaining = parsed.refillsRemaining;
    if (parsed.prescriptionRecordId) input.prescriptionRecordId = parsed.prescriptionRecordId;
    if (parsed.status) input.status = parsed.status;

    const medication = await createDoctorPrescription(
      auth.user.nexusId,
      targetPatientNexusId,
      input
    );

    return ok(medication, 201);
  } catch (error) {
    if (error instanceof Error && !(error instanceof z.ZodError)) {
      return err("INVALID_REQUEST", error.message, 400);
    }
    return fromError(error);
  }
}
