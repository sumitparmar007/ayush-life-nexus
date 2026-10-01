/**
 * Lab Results Domain Types
 *
 * Canonical types for the Lab Results module (Phase 6).
 * Consumed by the store, service layer, API routes, hooks, and UI components.
 */

// ─── Lab Category ─────────────────────────────────────────────────────────────

export const LabCategory = {
  BIOCHEMISTRY: "BIOCHEMISTRY",
  HEMATOLOGY: "HEMATOLOGY",
  LIPID_PROFILE: "LIPID_PROFILE",
  ENDOCRINE_THYROID: "ENDOCRINE_THYROID",
  URINALYSIS: "URINALYSIS",
  MICROBIOLOGY: "MICROBIOLOGY",
  IMMUNOLOGY: "IMMUNOLOGY",
  OTHER: "OTHER",
} as const;
export type LabCategory = (typeof LabCategory)[keyof typeof LabCategory];

export const LAB_CATEGORY_LABELS: Record<LabCategory, string> = {
  BIOCHEMISTRY: "Biochemistry / Metabolic",
  HEMATOLOGY: "Hematology / CBC",
  LIPID_PROFILE: "Lipid Profile",
  ENDOCRINE_THYROID: "Endocrine & Thyroid",
  URINALYSIS: "Urinalysis",
  MICROBIOLOGY: "Microbiology & Cultures",
  IMMUNOLOGY: "Immunology & Serology",
  OTHER: "Other Diagnostic Test",
};

// ─── Lab Result Status ────────────────────────────────────────────────────────

export const LabResultStatus = {
  NORMAL: "NORMAL",
  ABNORMAL: "ABNORMAL",
  CRITICAL: "CRITICAL",
  PENDING: "PENDING",
} as const;
export type LabResultStatus =
  (typeof LabResultStatus)[keyof typeof LabResultStatus];

export const LAB_RESULT_STATUS_LABELS: Record<LabResultStatus, string> = {
  NORMAL: "Normal",
  ABNORMAL: "Abnormal",
  CRITICAL: "Critical / Out of Range",
  PENDING: "Pending Review",
};

// ─── Core Entity ──────────────────────────────────────────────────────────────

export interface LabResult {
  id: string;
  nexusId: string; // Owner (foreign key to StoredUser.nexusId)
  testName: string; // e.g. "HbA1c", "Serum Creatinine", "Total Cholesterol"
  category: LabCategory;
  value: string; // e.g. "5.8", "Negative", "120"
  numericValue?: number | undefined;
  unit?: string | undefined; // e.g. "%", "mg/dL", "U/L"
  referenceRangeMin?: number | undefined;
  referenceRangeMax?: number | undefined;
  referenceRangeText?: string | undefined; // e.g. "< 5.7 %" or "70 - 99 mg/dL"
  status: LabResultStatus;
  labName?: string | undefined; // Diagnostic center / Lab provider
  collectedAt?: Date | undefined; // Date sample was drawn
  resultDate?: Date | undefined; // Date report was finalized
  notes?: string | undefined;
  healthRecordId?: string | undefined; // Optional reference to a LAB_REPORT in Health Records
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

// ─── List Item (Lighter shape for lists/tables) ───────────────────────────────

export interface LabListItem {
  id: string;
  testName: string;
  category: LabCategory;
  value: string;
  numericValue?: number | undefined;
  unit?: string | undefined;
  referenceRangeText?: string | undefined;
  status: LabResultStatus;
  labName?: string | undefined;
  collectedAt?: Date | undefined;
  resultDate?: Date | undefined;
  healthRecordId?: string | undefined;
  createdAt: Date;
}

// ─── Create Input ─────────────────────────────────────────────────────────────

export interface CreateLabResultInput {
  testName: string;
  category: LabCategory;
  value: string;
  numericValue?: number | undefined;
  unit?: string | undefined;
  referenceRangeMin?: number | undefined;
  referenceRangeMax?: number | undefined;
  referenceRangeText?: string | undefined;
  status: LabResultStatus;
  labName?: string | undefined;
  collectedAt?: string | undefined; // ISO date string from client
  resultDate?: string | undefined; // ISO date string from client
  notes?: string | undefined;
  healthRecordId?: string | undefined;
}

// ─── Update Input ─────────────────────────────────────────────────────────────

export interface UpdateLabResultInput {
  testName?: string | undefined;
  category?: LabCategory | undefined;
  value?: string | undefined;
  numericValue?: number | undefined;
  unit?: string | undefined;
  referenceRangeMin?: number | undefined;
  referenceRangeMax?: number | undefined;
  referenceRangeText?: string | undefined;
  status?: LabResultStatus | undefined;
  labName?: string | undefined;
  collectedAt?: string | undefined;
  resultDate?: string | undefined;
  notes?: string | undefined;
  healthRecordId?: string | undefined;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface LabFilters {
  search?: string | undefined;
  category?: LabCategory | undefined;
  status?: LabResultStatus | undefined;
  sortBy?: "testName" | "resultDate" | "createdAt" | "status" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

// ─── List Response ────────────────────────────────────────────────────────────

export interface LabListResponse {
  labs: LabListItem[];
  total: number;
  filters: LabFilters;
}
