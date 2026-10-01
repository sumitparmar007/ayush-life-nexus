/**
 * Insurance Service
 *
 * Business logic layer for Insurance & Coverage operations.
 * Sits between API routes and the singleton store.
 */

import {
  createInsurancePolicy as storeCreate,
  findInsurancePolicyById,
  findInsurancePoliciesByUser,
  updateInsurancePolicy as storeUpdate,
  deleteInsurancePolicy as storeDelete,
  findHealthRecordById,
  type StoredInsurancePolicy,
  type CreateInsuranceParams,
} from "@/lib/store.ts";

import type {
  InsurancePolicy,
  InsuranceListItem,
  InsuranceListResponse,
  InsuranceFilters,
  CreateInsuranceInput,
  UpdateInsuranceInput,
  InsurancePolicyType,
  InsurancePolicyStatus,
} from "@/types/insurance.ts";

import type { InsuranceSummary } from "@/types/dashboard.ts";
import { recordActivity } from "@/lib/activity-service.ts";
import { ActivityType } from "@/types/activity.ts";

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toInsurancePolicy(stored: StoredInsurancePolicy): InsurancePolicy {
  return {
    id: stored.id,
    nexusId: stored.nexusId,
    policyNumber: stored.policyNumber,
    providerName: stored.providerName,
    policyName: stored.policyName,
    policyType: stored.policyType as InsurancePolicyType,
    sumInsured: stored.sumInsured,
    premiumAmount: stored.premiumAmount,
    startDate: stored.startDate,
    expiryDate: stored.expiryDate,
    status: stored.status as InsurancePolicyStatus,
    tpaName: stored.tpaName,
    tpaContact: stored.tpaContact,
    networkHospitalUrl: stored.networkHospitalUrl,
    policyDocumentRecordId: stored.policyDocumentRecordId,
    notes: stored.notes,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    deletedAt: stored.deletedAt,
  };
}

function toListItem(stored: StoredInsurancePolicy): InsuranceListItem {
  return {
    id: stored.id,
    policyNumber: stored.policyNumber,
    providerName: stored.providerName,
    policyName: stored.policyName,
    policyType: stored.policyType as InsurancePolicyType,
    sumInsured: stored.sumInsured,
    premiumAmount: stored.premiumAmount,
    startDate: stored.startDate,
    expiryDate: stored.expiryDate,
    status: stored.status as InsurancePolicyStatus,
    tpaName: stored.tpaName,
    tpaContact: stored.tpaContact,
    networkHospitalUrl: stored.networkHospitalUrl,
    policyDocumentRecordId: stored.policyDocumentRecordId,
    createdAt: stored.createdAt,
  };
}

// ─── Health Record Link Validation ────────────────────────────────────────────

export function validateInsuranceDocumentLink(
  policyDocumentRecordId: string,
  nexusId: string
): { valid: boolean; reason?: string } {
  const record = findHealthRecordById(policyDocumentRecordId);
  if (!record) {
    return { valid: false, reason: "Insurance document not found in health records" };
  }
  if (record.nexusId !== nexusId) {
    return { valid: false, reason: "Insurance document belongs to another user" };
  }
  if (record.deletedAt) {
    return { valid: false, reason: "Insurance document has been deleted" };
  }
  if (record.category !== "INSURANCE_DOCUMENT") {
    return {
      valid: false,
      reason: "Referenced health record is not an insurance document",
    };
  }
  return { valid: true };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createInsurancePolicy(
  nexusId: string,
  input: CreateInsuranceInput
): Promise<InsurancePolicy> {
  // Validate referenced policy document in health records if provided
  if (input.policyDocumentRecordId) {
    const validation = validateInsuranceDocumentLink(
      input.policyDocumentRecordId,
      nexusId
    );
    if (!validation.valid) {
      throw new Error(validation.reason || "Invalid insurance document reference");
    }
  }

  const params: CreateInsuranceParams = {
    nexusId,
    policyNumber: input.policyNumber.trim(),
    providerName: input.providerName.trim(),
    policyName: input.policyName.trim(),
    policyType: input.policyType,
    sumInsured: input.sumInsured,
    premiumAmount: input.premiumAmount,
    startDate: input.startDate ? new Date(input.startDate) : undefined,
    expiryDate: new Date(input.expiryDate),
    status: input.status,
    tpaName: input.tpaName?.trim() || undefined,
    tpaContact: input.tpaContact?.trim() || undefined,
    networkHospitalUrl: input.networkHospitalUrl?.trim() || undefined,
    policyDocumentRecordId: input.policyDocumentRecordId?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };

  const stored = storeCreate(params);

  void recordActivity(nexusId, {
    type: ActivityType.INSURANCE_UPDATED,
    title: "Insurance Policy Added",
    description: "An insurance policy was added or updated.",
    entityType: "insurance_policy",
    entityId: stored.id,
  });

  return toInsurancePolicy(stored);
}

// ─── Read (single) ────────────────────────────────────────────────────────────

export async function getInsurancePolicy(
  id: string,
  nexusId: string
): Promise<InsurancePolicy | null> {
  const stored = findInsurancePolicyById(id);
  if (!stored) return null;
  // Strict user isolation
  if (stored.nexusId !== nexusId) return null;
  if (stored.deletedAt) return null;
  return toInsurancePolicy(stored);
}

// ─── Read (list with filters) ─────────────────────────────────────────────────

export async function listInsurancePolicies(
  nexusId: string,
  filters: InsuranceFilters = {}
): Promise<InsuranceListResponse> {
  const allStored = findInsurancePoliciesByUser(nexusId);

  let results = allStored;

  // Search filter (providerName, policyName, policyNumber, tpaName, notes)
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(
      (item) =>
        item.providerName.toLowerCase().includes(q) ||
        item.policyName.toLowerCase().includes(q) ||
        item.policyNumber.toLowerCase().includes(q) ||
        (item.tpaName && item.tpaName.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q))
    );
  }

  // Status filter
  if (filters.status) {
    results = results.filter((item) => item.status === filters.status);
  }

  // Type filter
  if (filters.type) {
    results = results.filter((item) => item.policyType === filters.type);
  }

  // Sorting
  const sortBy = filters.sortBy || "expiryDate";
  const sortOrder = filters.sortOrder || "asc";

  results.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "providerName") {
      comparison = a.providerName.localeCompare(b.providerName);
    } else if (sortBy === "sumInsured") {
      comparison = a.sumInsured - b.sumInsured;
    } else if (sortBy === "createdAt") {
      comparison = a.createdAt.getTime() - b.createdAt.getTime();
    } else {
      // Default: expiryDate (closest renewal first)
      comparison = a.expiryDate.getTime() - b.expiryDate.getTime();
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return {
    policies: results.map(toListItem),
    total: results.length,
    filters,
  };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateInsurancePolicy(
  id: string,
  nexusId: string,
  input: UpdateInsuranceInput
): Promise<InsurancePolicy | null> {
  const existing = findInsurancePolicyById(id);
  if (!existing || existing.nexusId !== nexusId || existing.deletedAt) {
    return null;
  }

  // Validate referenced document if updated
  if (input.policyDocumentRecordId !== undefined && input.policyDocumentRecordId !== "") {
    const validation = validateInsuranceDocumentLink(
      input.policyDocumentRecordId,
      nexusId
    );
    if (!validation.valid) {
      throw new Error(validation.reason || "Invalid insurance document reference");
    }
  }

  const updates: Partial<StoredInsurancePolicy> = {};

  if (input.policyNumber !== undefined) updates.policyNumber = input.policyNumber.trim();
  if (input.providerName !== undefined) updates.providerName = input.providerName.trim();
  if (input.policyName !== undefined) updates.policyName = input.policyName.trim();
  if (input.policyType !== undefined) updates.policyType = input.policyType;
  if (input.sumInsured !== undefined) updates.sumInsured = input.sumInsured;
  if (input.premiumAmount !== undefined) updates.premiumAmount = input.premiumAmount;
  if (input.startDate !== undefined) {
    updates.startDate = input.startDate ? new Date(input.startDate) : undefined;
  }
  if (input.expiryDate !== undefined) {
    updates.expiryDate = new Date(input.expiryDate);
  }
  if (input.status !== undefined) updates.status = input.status;
  if (input.tpaName !== undefined) updates.tpaName = input.tpaName?.trim() || undefined;
  if (input.tpaContact !== undefined) updates.tpaContact = input.tpaContact?.trim() || undefined;
  if (input.networkHospitalUrl !== undefined) {
    updates.networkHospitalUrl = input.networkHospitalUrl?.trim() || undefined;
  }
  if (input.policyDocumentRecordId !== undefined) {
    updates.policyDocumentRecordId = input.policyDocumentRecordId?.trim() || undefined;
  }
  if (input.notes !== undefined) updates.notes = input.notes?.trim() || undefined;

  const stored = storeUpdate(id, nexusId, updates);
  if (!stored) return null;

  void recordActivity(nexusId, {
    type: ActivityType.INSURANCE_UPDATED,
    title: "Insurance Policy Updated",
    description: "An insurance policy was added or updated.",
    entityType: "insurance_policy",
    entityId: stored.id,
  });

  return toInsurancePolicy(stored);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteInsurancePolicy(
  id: string,
  nexusId: string
): Promise<boolean> {
  return storeDelete(id, nexusId);
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

/**
 * Normalizes a Date to midnight UTC for precise calendar-day arithmetic.
 */
function toCalendarUtcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function getInsuranceSummary(nexusId: string): InsuranceSummary {
  const policies = findInsurancePoliciesByUser(nexusId);

  let activePolicies = 0;
  let totalCoverage = 0;
  let nearestRenewalDays: number | null = null;
  let lastUpdatedAt: Date | null = null;

  const now = new Date();
  const todayUtcMs = toCalendarUtcMidnight(now);
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (const p of policies) {
    if (p.status === "ACTIVE") {
      activePolicies++;
      totalCoverage += p.sumInsured;

      // Calendar-day calculation
      const expiryUtcMs = toCalendarUtcMidnight(p.expiryDate);
      const diffDays = Math.round((expiryUtcMs - todayUtcMs) / oneDayMs);

      // Only consider upcoming/future renewals (0 = today, > 0 = future)
      if (diffDays >= 0) {
        if (nearestRenewalDays === null || diffDays < nearestRenewalDays) {
          nearestRenewalDays = diffDays;
        }
      }
    }

    if (!lastUpdatedAt || p.updatedAt > lastUpdatedAt) {
      lastUpdatedAt = p.updatedAt;
    }
  }

  return {
    activePolicies,
    totalCoverage: activePolicies > 0 ? totalCoverage : null,
    nearestRenewalDays,
    lastUpdatedAt,
  };
}
