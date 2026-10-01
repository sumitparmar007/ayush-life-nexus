/**
 * Doctor Patient Discovery API
 *
 * GET /api/doctor/patients/lookup?nexusId=...
 *
 * Allows authenticated doctors to look up a patient using their exact Nexus ID.
 * Returns only minimal safe identity information necessary for confirmation.
 * Never exposes patient medical records, medications, labs, or private history.
 */

import { type NextRequest } from "next/server";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import {
  findSession,
  findUserById,
  findActiveConsent,
  findConsentsByDoctorAndPatient,
} from "@/lib/store.ts";
import { ok, err } from "@/lib/api-response.ts";

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
    return { error: err("FORBIDDEN", "Only doctors can perform patient discovery", 403) };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateDoctor(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const targetNexusId = searchParams.get("nexusId")?.trim();

  // 1. Validation: Nexus ID presence
  if (!targetNexusId) {
    return err("INVALID_REQUEST", "Patient Nexus ID is required", 400);
  }

  // 2. Validation: format check
  if (!targetNexusId.startsWith("nexus_") || targetNexusId.length < 10) {
    return err("INVALID_FORMAT", "Invalid Nexus ID format. Must start with 'nexus_'", 400);
  }

  // 3. Validation: self-lookup check
  if (targetNexusId === auth.user.nexusId) {
    return err("SELF_LOOKUP", "Cannot look up your own Doctor Nexus ID as a patient", 400);
  }

  // 4. Look up target user in store
  const targetUser = findUserById(targetNexusId);
  if (!targetUser || targetUser.role !== "PATIENT") {
    // Return 404 if user does not exist or is a Doctor (prevent doctor role enumeration)
    return err("PATIENT_NOT_FOUND", "Patient with the specified Nexus ID was not found", 404);
  }

  // 5. Check if active or pending consent exists between this doctor and target patient
  const activeConsent = findActiveConsent(auth.user.nexusId, targetUser.nexusId);
  const allDoctorPatientConsents = findConsentsByDoctorAndPatient(
    auth.user.nexusId,
    targetUser.nexusId
  );
  const pendingConsent = allDoctorPatientConsents.find(
    (c) => c.status === "PENDING_APPROVAL"
  );

  // 6. Return strictly minimal identity information
  return ok({
    nexusId: targetUser.nexusId,
    displayName: targetUser.displayName || "Patient",
    connectionStatus: activeConsent
      ? "ACTIVE"
      : pendingConsent
      ? "PENDING_APPROVAL"
      : "DISCONNECTED",
    consentDetails: activeConsent
      ? {
          consentId: activeConsent.id,
          status: "ACTIVE",
          expiresAt: activeConsent.expiresAt,
          dataScopes: activeConsent.dataScopes,
        }
      : pendingConsent
      ? {
          consentId: pendingConsent.id,
          status: "PENDING_APPROVAL",
          expiresAt: pendingConsent.expiresAt,
          dataScopes: pendingConsent.dataScopes,
        }
      : null,
  });
}
