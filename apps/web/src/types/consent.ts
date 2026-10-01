/**
 * Consent & Privacy Domain Types
 *
 * Canonical types for the Consent & Privacy module (Phase 8).
 * Consumed by the store, service layer, API routes, client hooks, and UI components.
 */

// ─── Consent Status ───────────────────────────────────────────────────────────

export const ConsentStatus = {
  ACTIVE: "ACTIVE",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
  REJECTED: "REJECTED",
} as const;
export type ConsentStatus = (typeof ConsentStatus)[keyof typeof ConsentStatus];

export const CONSENT_STATUS_LABELS: Record<ConsentStatus, string> = {
  ACTIVE: "Active & Granted",
  PENDING_APPROVAL: "Pending Request",
  REVOKED: "Revoked",
  EXPIRED: "Expired",
  REJECTED: "Request Rejected",
};

// ─── Recipient Type ───────────────────────────────────────────────────────────

export const ConsentRecipientType = {
  DOCTOR: "DOCTOR",
  HOSPITAL_CLINIC: "HOSPITAL_CLINIC",
  INSURER_TPA: "INSURER_TPA",
  RESEARCH_AYUSH: "RESEARCH_AYUSH",
  EMERGENCY_ACCESS: "EMERGENCY_ACCESS",
  OTHER: "OTHER",
} as const;
export type ConsentRecipientType =
  (typeof ConsentRecipientType)[keyof typeof ConsentRecipientType];

export const CONSENT_RECIPIENT_TYPE_LABELS: Record<
  ConsentRecipientType,
  string
> = {
  DOCTOR: "Doctor / Specialist",
  HOSPITAL_CLINIC: "Hospital / Healthcare Clinic",
  INSURER_TPA: "Insurance / TPA Desk",
  RESEARCH_AYUSH: "Ayush Research Study",
  EMERGENCY_ACCESS: "Emergency Contact / Provider",
  OTHER: "Other Healthcare Entity",
};

// ─── Purpose ──────────────────────────────────────────────────────────────────

export const ConsentPurpose = {
  DIRECT_CARE: "DIRECT_CARE",
  SECOND_OPINION: "SECOND_OPINION",
  CLAIM_SETTLEMENT: "CLAIM_SETTLEMENT",
  RESEARCH_STUDY: "RESEARCH_STUDY",
  EMERGENCY_CARE: "EMERGENCY_CARE",
  OTHER: "OTHER",
} as const;
export type ConsentPurpose =
  (typeof ConsentPurpose)[keyof typeof ConsentPurpose];

export const CONSENT_PURPOSE_LABELS: Record<ConsentPurpose, string> = {
  DIRECT_CARE: "Direct Medical Care & Treatment",
  SECOND_OPINION: "Second Opinion Consultation",
  CLAIM_SETTLEMENT: "Insurance Claim Processing",
  RESEARCH_STUDY: "Ayush Research & Clinical Study",
  EMERGENCY_CARE: "Emergency Medical Access",
  OTHER: "Other Medical Purpose",
};

// ─── Data Scope (Reusing existing project terminology) ────────────────────────

export const ConsentDataScope = {
  ALL_DATA: "ALL_DATA",
  HEALTH_RECORDS: "HEALTH_RECORDS",
  PRESCRIPTIONS: "PRESCRIPTIONS",
  LAB_REPORTS: "LAB_REPORTS",
  INSURANCE_DOCUMENTS: "INSURANCE_DOCUMENTS",
} as const;
export type ConsentDataScope =
  (typeof ConsentDataScope)[keyof typeof ConsentDataScope];

export const CONSENT_DATA_SCOPE_LABELS: Record<ConsentDataScope, string> = {
  ALL_DATA: "All Health Records & History",
  HEALTH_RECORDS: "Clinical Summaries & Documents",
  PRESCRIPTIONS: "Prescriptions & Medications",
  LAB_REPORTS: "Diagnostic Lab Reports",
  INSURANCE_DOCUMENTS: "Insurance Policies & Documents",
};

// ─── Permission Level ─────────────────────────────────────────────────────────

export const ConsentPermission = {
  VIEW_ONLY: "VIEW_ONLY",
  VIEW_AND_DOWNLOAD: "VIEW_AND_DOWNLOAD",
} as const;
export type ConsentPermission =
  (typeof ConsentPermission)[keyof typeof ConsentPermission];

export const CONSENT_PERMISSION_LABELS: Record<ConsentPermission, string> = {
  VIEW_ONLY: "View Only (No Downloads)",
  VIEW_AND_DOWNLOAD: "View and Download Records",
};

// ─── Core Entity ──────────────────────────────────────────────────────────────

export interface ConsentRecord {
  id: string;
  nexusId: string; // Patient owner foreign key
  recipientNexusId?: string | undefined; // Doctor nexusId when granted/requested by a doctor
  recipientName: string; // e.g. "Dr. Sneha Verma, Cardiologist"
  recipientType: ConsentRecipientType;
  organizationName?: string | undefined; // e.g. "Max Super Speciality Hospital"
  purpose: ConsentPurpose;
  dataScopes: ConsentDataScope[];
  permission: ConsentPermission;
  status: ConsentStatus;
  grantedAt?: Date | undefined;
  revokedAt?: Date | undefined;
  expiresAt: Date;
  notes?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

// ─── List Item ────────────────────────────────────────────────────────────────

export interface ConsentListItem {
  id: string;
  nexusId?: string | undefined;
  recipientNexusId?: string | undefined;
  recipientName: string;
  recipientType: ConsentRecipientType;
  organizationName?: string | undefined;
  purpose: ConsentPurpose;
  dataScopes: ConsentDataScope[];
  permission: ConsentPermission;
  status: ConsentStatus;
  grantedAt?: Date | undefined;
  revokedAt?: Date | undefined;
  expiresAt: Date;
  createdAt: Date;
}

// ─── Create Input ─────────────────────────────────────────────────────────────

export interface CreateConsentInput {
  recipientNexusId?: string | undefined;
  recipientName: string;
  recipientType: ConsentRecipientType;
  organizationName?: string | undefined;
  purpose: ConsentPurpose;
  dataScopes: ConsentDataScope[];
  permission: ConsentPermission;
  status?: ConsentStatus | undefined; // Defaults to ACTIVE unless PENDING_APPROVAL specified
  expiresAt: string; // ISO Date string
  notes?: string | undefined;
}

// ─── Update Input ─────────────────────────────────────────────────────────────

export interface UpdateConsentInput {
  recipientNexusId?: string | undefined;
  recipientName?: string | undefined;
  recipientType?: ConsentRecipientType | undefined;
  organizationName?: string | undefined;
  purpose?: ConsentPurpose | undefined;
  dataScopes?: ConsentDataScope[] | undefined;
  permission?: ConsentPermission | undefined;
  status?: ConsentStatus | undefined;
  expiresAt?: string | undefined;
  notes?: string | undefined;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface ConsentFilters {
  search?: string | undefined;
  status?: ConsentStatus | undefined;
  recipientType?: ConsentRecipientType | undefined;
  sortBy?: "recipientName" | "expiresAt" | "createdAt" | "status" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

// ─── List Response ────────────────────────────────────────────────────────────

export interface ConsentListResponse {
  consents: ConsentListItem[];
  total: number;
  filters: ConsentFilters;
}
