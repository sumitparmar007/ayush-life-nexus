/**
 * Doctor Patient Records Access API (Read-Only) — Phase 11D
 *
 * GET /api/doctor/patients/[nexusId]/records
 *
 * Requirements:
 * 1. Authenticated Doctor session only (derived strictly from server session cookie)
 * 2. Target patient validation
 * 3. Centralized authorization check via canDoctorAccessPatient() with HEALTH_RECORDS scope
 * 4. Read-only projection of target patient's non-deleted health records
 * 5. PATIENT_DATA_ACCESSED audit event logging on successful access
 */

import { type NextRequest } from "next/server";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import { findSession, findUserById } from "@/lib/store.ts";
import { canDoctorAccessPatient } from "@/lib/doctor-authorization.ts";
import { listRecords } from "@/lib/health-records-service.ts";
import { recordActivity } from "@/lib/activity-service.ts";
import { ok, err } from "@/lib/api-response.ts";
import { ConsentDataScope } from "@/types/consent.ts";
import { ActivityType } from "@/types/activity.ts";
import type { RecordCategory } from "@/types/health-records.ts";

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
    ConsentDataScope.HEALTH_RECORDS
  );

  if (!authResult.allowed) {
    // Return 404 if target patient does not exist or is not a patient (prevent enumeration)
    const targetUser = findUserById(targetPatientNexusId);
    if (!targetUser || targetUser.role !== "PATIENT") {
      return err("PATIENT_NOT_FOUND", "Patient not found", 404);
    }
    return err("FORBIDDEN", authResult.reason || "Access denied by consent policy", 403);
  }

  // 2. Query parameters / filtering
  const { searchParams } = new URL(request.url);
  const filters: import("@/types/health-records.ts").HealthRecordFilters = {};
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  if (search) filters.search = search;
  if (category) filters.category = category as typeof RecordCategory[keyof typeof RecordCategory];
  if (sortBy) filters.sortBy = sortBy as "createdAt" | "issuedDate" | "title";
  if (sortOrder) filters.sortOrder = sortOrder as "asc" | "desc";

  // 3. Read target patient's records
  const data = await listRecords(targetPatientNexusId, filters);

  // 4. Log audit event on successful access
  const doctorName = auth.user.displayName || "Doctor";
  const formattedDoctorName = doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`;

  void recordActivity(targetPatientNexusId, {
    type: ActivityType.PATIENT_DATA_ACCESSED,
    title: "Health Records Accessed",
    description: `${formattedDoctorName} accessed your health records.`,
    entityType: "health_record",
  });

  const targetPatient = findUserById(targetPatientNexusId);
  const patientDisplayName = targetPatient?.displayName || "Patient";

  void recordActivity(auth.user.nexusId, {
    type: ActivityType.PATIENT_DATA_ACCESSED,
    title: "Patient Records Accessed",
    description: `Accessed health records for ${patientDisplayName}.`,
    entityType: "health_record",
  });

  return ok(data);
}
