/**
 * Medications Domain Types
 *
 * Canonical types for the Medications module (Phase 5).
 * Consumed by the store, service layer, API routes, hooks, and UI components.
 */

// ─── Status ───────────────────────────────────────────────────────────────────

export const MedicationStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  DISCONTINUED: "DISCONTINUED",
} as const;
export type MedicationStatus =
  (typeof MedicationStatus)[keyof typeof MedicationStatus];

export const MEDICATION_STATUS_LABELS: Record<MedicationStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  DISCONTINUED: "Discontinued",
};

// ─── Frequency ────────────────────────────────────────────────────────────────

export const MedicationFrequency = {
  ONCE_DAILY: "ONCE_DAILY",
  TWICE_DAILY: "TWICE_DAILY",
  THRICE_DAILY: "THRICE_DAILY",
  FOUR_TIMES_DAILY: "FOUR_TIMES_DAILY",
  EVERY_OTHER_DAY: "EVERY_OTHER_DAY",
  WEEKLY: "WEEKLY",
  AS_NEEDED: "AS_NEEDED",
  CUSTOM: "CUSTOM",
} as const;
export type MedicationFrequency =
  (typeof MedicationFrequency)[keyof typeof MedicationFrequency];

export const MEDICATION_FREQUENCY_LABELS: Record<MedicationFrequency, string> = {
  ONCE_DAILY: "Once daily",
  TWICE_DAILY: "Twice daily",
  THRICE_DAILY: "Three times daily",
  FOUR_TIMES_DAILY: "Four times daily",
  EVERY_OTHER_DAY: "Every other day",
  WEEKLY: "Weekly",
  AS_NEEDED: "As needed (PRN)",
  CUSTOM: "Custom schedule",
};

// ─── Route / Form ─────────────────────────────────────────────────────────────

export const MedicationRoute = {
  ORAL_TABLET: "ORAL_TABLET",
  ORAL_CAPSULE: "ORAL_CAPSULE",
  ORAL_LIQUID: "ORAL_LIQUID",
  INJECTION: "INJECTION",
  TOPICAL: "TOPICAL",
  DROPS: "DROPS",
  INHALER: "INHALER",
  OTHER: "OTHER",
} as const;
export type MedicationRoute =
  (typeof MedicationRoute)[keyof typeof MedicationRoute];

export const MEDICATION_ROUTE_LABELS: Record<MedicationRoute, string> = {
  ORAL_TABLET: "Oral Tablet",
  ORAL_CAPSULE: "Oral Capsule",
  ORAL_LIQUID: "Oral Liquid / Syrup",
  INJECTION: "Injection",
  TOPICAL: "Topical / Ointment",
  DROPS: "Drops (Eye/Ear/Nose)",
  INHALER: "Inhaler / Respules",
  OTHER: "Other",
};

// ─── Core Entity ──────────────────────────────────────────────────────────────

export interface PrescriberProfile {
  doctorNexusId: string;
  displayName: string;
  specialization?: string | undefined;
  clinicName?: string | undefined;
}

export interface Medication {
  id: string;
  nexusId: string; // Owner (foreign key to StoredUser.nexusId)
  name: string;
  dosage: string;
  dosageUnit: string;
  frequency: MedicationFrequency;
  route: MedicationRoute;
  instructions?: string | undefined;
  prescribedBy?: string | undefined;
  prescribedByNexusId?: string | null | undefined;
  prescriberProfile?: PrescriberProfile | null | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  refillsRemaining?: number | undefined;
  prescriptionRecordId?: string | undefined; // Optional reference to HealthRecord
  status: MedicationStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

// ─── List Item (Lighter shape for lists) ──────────────────────────────────────

export interface MedicationListItem {
  id: string;
  name: string;
  dosage: string;
  dosageUnit: string;
  frequency: MedicationFrequency;
  route: MedicationRoute;
  status: MedicationStatus;
  prescribedBy?: string | undefined;
  prescribedByNexusId?: string | null | undefined;
  prescriberProfile?: PrescriberProfile | null | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  refillsRemaining?: number | undefined;
  prescriptionRecordId?: string | undefined;
  createdAt: Date;
}

// ─── Create Input ─────────────────────────────────────────────────────────────

export interface CreateMedicationInput {
  name: string;
  dosage: string;
  dosageUnit: string;
  frequency: MedicationFrequency;
  route: MedicationRoute;
  instructions?: string | undefined;
  prescribedBy?: string | undefined;
  prescribedByNexusId?: string | null | undefined;
  startDate?: string | undefined; // ISO date string from client
  endDate?: string | undefined;   // ISO date string from client
  refillsRemaining?: number | undefined;
  prescriptionRecordId?: string | undefined;
  status?: MedicationStatus | undefined; // Defaults to ACTIVE
}

// ─── Update Input ─────────────────────────────────────────────────────────────

export interface UpdateMedicationInput {
  name?: string | undefined;
  dosage?: string | undefined;
  dosageUnit?: string | undefined;
  frequency?: MedicationFrequency | undefined;
  route?: MedicationRoute | undefined;
  instructions?: string | undefined;
  prescribedBy?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  refillsRemaining?: number | undefined;
  prescriptionRecordId?: string | undefined;
  status?: MedicationStatus | undefined;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface MedicationFilters {
  search?: string | undefined;
  status?: MedicationStatus | undefined;
  sortBy?: "name" | "createdAt" | "startDate" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

// ─── List Response ────────────────────────────────────────────────────────────

export interface MedicationListResponse {
  medications: MedicationListItem[];
  total: number;
  filters: MedicationFilters;
}
