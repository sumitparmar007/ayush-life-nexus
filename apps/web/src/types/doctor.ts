/**
 * Doctor Domain Types
 *
 * Canonical types for the Doctor Profile module (Phase 11A).
 * Consumed by the store, service layer, API routes, and UI components.
 *
 * NOTE: registrationNumber is SELF-REPORTED only.
 * There is NO external verification of medical licenses in the MVP.
 */

// ─── Profile Status ───────────────────────────────────────────────────────────

export const DoctorProfileStatus = {
  INCOMPLETE: "INCOMPLETE",
  ACTIVE: "ACTIVE",
} as const;
export type DoctorProfileStatus =
  (typeof DoctorProfileStatus)[keyof typeof DoctorProfileStatus];

export const DOCTOR_PROFILE_STATUS_LABELS: Record<DoctorProfileStatus, string> = {
  INCOMPLETE: "Profile Incomplete",
  ACTIVE: "Active",
};

// ─── Doctor Profile ───────────────────────────────────────────────────────────

export interface DoctorProfile {
  nexusId: string;
  displayName?: string | undefined;
  email?: string | undefined;
  specialization?: string | undefined;
  qualifications?: string | undefined;
  clinicName?: string | undefined;
  registrationNumber?: string | undefined;        // Self-reported only
  consultationAddress?: string | undefined;
  consultationPhone?: string | undefined;
  profileStatus: DoctorProfileStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Update Profile Input ─────────────────────────────────────────────────────

export interface UpdateDoctorProfileInput {
  displayName?: string | undefined;
  email?: string | undefined;
  specialization?: string | undefined;
  qualifications?: string | undefined;
  clinicName?: string | undefined;
  registrationNumber?: string | undefined;
  consultationAddress?: string | undefined;
  consultationPhone?: string | undefined;
}

// ─── Doctor Registration Input ────────────────────────────────────────────────

export interface DoctorRegistrationInput {
  phone: string;
  displayName: string;
  specialization: string;
  clinicName: string;
  qualifications?: string | undefined;
  registrationNumber?: string | undefined;
  consultationAddress?: string | undefined;
  consultationPhone?: string | undefined;
}
