/**
 * Health Records Domain Types
 *
 * Canonical types for the Health Records module (Phase 4).
 * These are consumed by the store, service layer, API routes,
 * and client components.
 */

// ─── Record category ─────────────────────────────────────────────────────────

export const RecordCategory = {
  PRESCRIPTION: "PRESCRIPTION",
  LAB_REPORT: "LAB_REPORT",
  DISCHARGE_SUMMARY: "DISCHARGE_SUMMARY",
  IMAGING: "IMAGING",
  VACCINATION: "VACCINATION",
  CONSULTATION_NOTE: "CONSULTATION_NOTE",
  INSURANCE_DOCUMENT: "INSURANCE_DOCUMENT",
  OTHER: "OTHER",
} as const;
export type RecordCategory = (typeof RecordCategory)[keyof typeof RecordCategory];

export const RECORD_CATEGORY_LABELS: Record<RecordCategory, string> = {
  PRESCRIPTION: "Prescription",
  LAB_REPORT: "Lab Report",
  DISCHARGE_SUMMARY: "Discharge Summary",
  IMAGING: "Imaging / Scan",
  VACCINATION: "Vaccination",
  CONSULTATION_NOTE: "Consultation Note",
  INSURANCE_DOCUMENT: "Insurance Document",
  OTHER: "Other",
};

// ─── Record source ────────────────────────────────────────────────────────────

export const RecordSource = {
  UPLOADED: "UPLOADED",
  ABDM_FETCHED: "ABDM_FETCHED",
  CONTRIBUTED: "CONTRIBUTED",
} as const;
export type RecordSource = (typeof RecordSource)[keyof typeof RecordSource];

export const RECORD_SOURCE_LABELS: Record<RecordSource, string> = {
  UPLOADED: "Uploaded",
  ABDM_FETCHED: "Fetched via ABDM",
  CONTRIBUTED: "Contributed",
};

// ─── Verification status ──────────────────────────────────────────────────────

export const RecordVerificationStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
export type RecordVerificationStatus =
  (typeof RecordVerificationStatus)[keyof typeof RecordVerificationStatus];

// ─── Core entity ──────────────────────────────────────────────────────────────

export interface HealthRecord {
  id: string;
  nexusId: string; // Owner (foreign key to StoredUser.nexusId)
  title: string;
  category: RecordCategory;
  source: RecordSource;
  verificationStatus: RecordVerificationStatus;
  notes?: string | undefined;
  issuedDate?: Date | undefined; // When the document was originally issued
  providerName?: string | undefined; // Hospital/clinic/lab name

  // File metadata (no actual blob storage in this phase)
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
  fileUrl: string; // Simulated URL for this phase

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

// ─── List item (lighter shape for lists) ──────────────────────────────────────

export interface HealthRecordListItem {
  id: string;
  title: string;
  category: RecordCategory;
  source: RecordSource;
  verificationStatus: RecordVerificationStatus;
  fileName: string;
  fileSizeBytes: number;
  issuedDate?: Date | undefined;
  providerName?: string | undefined;
  createdAt: Date;
}

// ─── Create input ─────────────────────────────────────────────────────────────

export interface CreateHealthRecordInput {
  title: string;
  category: RecordCategory;
  notes?: string | undefined;
  issuedDate?: string | undefined; // ISO date string from client
  providerName?: string | undefined;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface HealthRecordFilters {
  search?: string | undefined;
  category?: RecordCategory | undefined;
  verificationStatus?: RecordVerificationStatus | undefined;
  sortBy?: "createdAt" | "issuedDate" | "title" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

// ─── Paginated response ───────────────────────────────────────────────────────

export interface HealthRecordListResponse {
  records: HealthRecordListItem[];
  total: number;
  filters: HealthRecordFilters;
}
