/**
 * Insurance Domain Types
 *
 * Canonical types for the Insurance & Coverage Management module (Phase 7).
 * Consumed by the store, service layer, API routes, hooks, and UI components.
 */

// ─── Policy Type ──────────────────────────────────────────────────────────────

export const InsurancePolicyType = {
  HEALTH_INDIVIDUAL: "HEALTH_INDIVIDUAL",
  HEALTH_FLOATER: "HEALTH_FLOATER",
  CRITICAL_ILLNESS: "CRITICAL_ILLNESS",
  TOP_UP_SUPER_TOP_UP: "TOP_UP_SUPER_TOP_UP",
  PERSONAL_ACCIDENT: "PERSONAL_ACCIDENT",
  AYUSH_COMPREHENSIVE: "AYUSH_COMPREHENSIVE",
  OTHER: "OTHER",
} as const;
export type InsurancePolicyType =
  (typeof InsurancePolicyType)[keyof typeof InsurancePolicyType];

export const INSURANCE_POLICY_TYPE_LABELS: Record<InsurancePolicyType, string> = {
  HEALTH_INDIVIDUAL: "Individual Health Insurance",
  HEALTH_FLOATER: "Family Floater Health Plan",
  CRITICAL_ILLNESS: "Critical Illness Cover",
  TOP_UP_SUPER_TOP_UP: "Top-Up / Super Top-Up",
  PERSONAL_ACCIDENT: "Personal Accident Cover",
  AYUSH_COMPREHENSIVE: "Ayush & Wellness Coverage",
  OTHER: "Other Insurance Policy",
};

// ─── Policy Status ────────────────────────────────────────────────────────────

export const InsurancePolicyStatus = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  GRACE_PERIOD: "GRACE_PERIOD",
  CANCELLED: "CANCELLED",
} as const;
export type InsurancePolicyStatus =
  (typeof InsurancePolicyStatus)[keyof typeof InsurancePolicyStatus];

export const INSURANCE_POLICY_STATUS_LABELS: Record<
  InsurancePolicyStatus,
  string
> = {
  ACTIVE: "Active / In-Force",
  EXPIRED: "Expired",
  GRACE_PERIOD: "Grace Period",
  CANCELLED: "Cancelled / Lapsed",
};

// ─── Core Entity ──────────────────────────────────────────────────────────────

export interface InsurancePolicy {
  id: string;
  nexusId: string; // Owner (foreign key to StoredUser.nexusId)
  policyNumber: string; // e.g. "HDFC-ERGO-9928123"
  providerName: string; // e.g. "Star Health", "HDFC ERGO", "Niva Bupa"
  policyName: string; // e.g. "Optima Secure Floater"
  policyType: InsurancePolicyType;
  sumInsured: number; // Coverage amount in INR (e.g. 1000000 = ₹10L)
  premiumAmount?: number | undefined; // Annual premium in INR
  startDate?: Date | undefined;
  expiryDate: Date; // Renewal / expiration date
  status: InsurancePolicyStatus;
  tpaName?: string | undefined; // Third Party Administrator (e.g. "Medi Assist")
  tpaContact?: string | undefined; // TPA helpline / phone
  networkHospitalUrl?: string | undefined; // Cashless network hospital locator
  policyDocumentRecordId?: string | undefined; // Optional reference to an INSURANCE_DOCUMENT in Health Records
  notes?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

// ─── List Item (Lighter shape for lists/tables) ───────────────────────────────

export interface InsuranceListItem {
  id: string;
  policyNumber: string;
  providerName: string;
  policyName: string;
  policyType: InsurancePolicyType;
  sumInsured: number;
  premiumAmount?: number | undefined;
  startDate?: Date | undefined;
  expiryDate: Date;
  status: InsurancePolicyStatus;
  tpaName?: string | undefined;
  tpaContact?: string | undefined;
  networkHospitalUrl?: string | undefined;
  policyDocumentRecordId?: string | undefined;
  createdAt: Date;
}

// ─── Create Input ─────────────────────────────────────────────────────────────

export interface CreateInsuranceInput {
  policyNumber: string;
  providerName: string;
  policyName: string;
  policyType: InsurancePolicyType;
  sumInsured: number;
  premiumAmount?: number | undefined;
  startDate?: string | undefined; // ISO date string from client
  expiryDate: string; // ISO date string from client (required)
  status: InsurancePolicyStatus;
  tpaName?: string | undefined;
  tpaContact?: string | undefined;
  networkHospitalUrl?: string | undefined;
  policyDocumentRecordId?: string | undefined;
  notes?: string | undefined;
}

// ─── Update Input ─────────────────────────────────────────────────────────────

export interface UpdateInsuranceInput {
  policyNumber?: string | undefined;
  providerName?: string | undefined;
  policyName?: string | undefined;
  policyType?: InsurancePolicyType | undefined;
  sumInsured?: number | undefined;
  premiumAmount?: number | undefined;
  startDate?: string | undefined;
  expiryDate?: string | undefined;
  status?: InsurancePolicyStatus | undefined;
  tpaName?: string | undefined;
  tpaContact?: string | undefined;
  networkHospitalUrl?: string | undefined;
  policyDocumentRecordId?: string | undefined;
  notes?: string | undefined;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface InsuranceFilters {
  search?: string | undefined;
  status?: InsurancePolicyStatus | undefined;
  type?: InsurancePolicyType | undefined;
  sortBy?: "providerName" | "sumInsured" | "expiryDate" | "createdAt" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

// ─── List Response ────────────────────────────────────────────────────────────

export interface InsuranceListResponse {
  policies: InsuranceListItem[];
  total: number;
  filters: InsuranceFilters;
}
