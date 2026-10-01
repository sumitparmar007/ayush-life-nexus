/**
 * Doctor-Patient Authorization Helper
 *
 * Centralized security boundary that verifies whether an authenticated doctor
 * has active, non-expired consent with the required scope to access a target patient.
 *
 * Security Model:
 * 1. Doctor identity check (exists and role === 'DOCTOR')
 * 2. Patient identity check (exists and role === 'PATIENT')
 * 3. Matching non-expired ACTIVE consent between patient and doctor
 * 4. Verification that requested dataScope is permitted (or ALL_DATA granted)
 */

import {
  findUserById,
  findConsentsByDoctorAndPatient,
  type StoredConsent,
} from "@/lib/store.ts";
import type { ConsentDataScope } from "@/types/consent.ts";

export interface DoctorAccessCheckResult {
  allowed: boolean;
  reason?: string;
  consent?: StoredConsent;
}

/**
 * Evaluates whether a doctor is authorized to access a patient's data.
 *
 * @param doctorNexusId - The authenticated doctor's Nexus ID
 * @param patientNexusId - The target patient's Nexus ID
 * @param requiredScope - Optional specific data category required for the operation
 * @returns DoctorAccessCheckResult with `allowed: true` or `allowed: false` + reason
 */
export function canDoctorAccessPatient(
  doctorNexusId: string,
  patientNexusId: string,
  requiredScope?: ConsentDataScope
): DoctorAccessCheckResult {
  // 1. Doctor identity check
  const doctor = findUserById(doctorNexusId);
  if (!doctor || doctor.role !== "DOCTOR") {
    return {
      allowed: false,
      reason: "Requesting user is not a registered doctor",
    };
  }

  // 2. Patient identity check
  const patient = findUserById(patientNexusId);
  if (!patient || patient.role !== "PATIENT") {
    return {
      allowed: false,
      reason: "Target user is not a valid patient",
    };
  }

  // Self-targeting is invalid
  if (doctorNexusId === patientNexusId) {
    return {
      allowed: false,
      reason: "Doctor cannot be their own patient target",
    };
  }

  // 3. Find matching active or expired consent
  const now = new Date();
  const matchingConsents = findConsentsByDoctorAndPatient(doctorNexusId, patientNexusId);
  const relevantConsent = matchingConsents.find(
    (c) => (c.status === "ACTIVE" || c.status === "EXPIRED") && !c.deletedAt
  );

  if (!relevantConsent) {
    return {
      allowed: false,
      reason: "No active consent granted by this patient to the doctor",
    };
  }

  // 4. Verify expiration
  if (relevantConsent.status === "EXPIRED" || relevantConsent.expiresAt.getTime() < now.getTime()) {
    return {
      allowed: false,
      reason: "Consent has expired",
    };
  }

  const consent = relevantConsent;

  // 5. Verify required scope
  if (requiredScope) {
    const hasScope =
      consent.dataScopes.includes(requiredScope) ||
      consent.dataScopes.includes("ALL_DATA");

    if (!hasScope) {
      return {
        allowed: false,
        reason: `Consent does not include the required '${requiredScope}' permission`,
      };
    }
  }

  return {
    allowed: true,
    consent,
  };
}
