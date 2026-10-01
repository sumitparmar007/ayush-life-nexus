/**
 * Lab Results Service
 *
 * Business logic layer for diagnostic lab test operations.
 * Sits between API routes and the singleton store.
 */

import {
  createLabResult as storeCreate,
  findLabResultById,
  findLabResultsByUser,
  updateLabResult as storeUpdate,
  deleteLabResult as storeDelete,
  findHealthRecordById,
  type StoredLabResult,
  type CreateLabResultParams,
} from "@/lib/store.ts";

import type {
  LabResult,
  LabListItem,
  LabListResponse,
  LabFilters,
  CreateLabResultInput,
  UpdateLabResultInput,
  LabCategory,
  LabResultStatus,
} from "@/types/labs.ts";

import type { LabSummary } from "@/types/dashboard.ts";
import { recordActivity } from "@/lib/activity-service.ts";
import { ActivityType } from "@/types/activity.ts";

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toLabResult(stored: StoredLabResult): LabResult {
  return {
    id: stored.id,
    nexusId: stored.nexusId,
    testName: stored.testName,
    category: stored.category as LabCategory,
    value: stored.value,
    numericValue: stored.numericValue,
    unit: stored.unit,
    referenceRangeMin: stored.referenceRangeMin,
    referenceRangeMax: stored.referenceRangeMax,
    referenceRangeText: stored.referenceRangeText,
    status: stored.status as LabResultStatus,
    labName: stored.labName,
    collectedAt: stored.collectedAt,
    resultDate: stored.resultDate,
    notes: stored.notes,
    healthRecordId: stored.healthRecordId,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    deletedAt: stored.deletedAt,
  };
}

function toListItem(stored: StoredLabResult): LabListItem {
  return {
    id: stored.id,
    testName: stored.testName,
    category: stored.category as LabCategory,
    value: stored.value,
    numericValue: stored.numericValue,
    unit: stored.unit,
    referenceRangeText: stored.referenceRangeText,
    status: stored.status as LabResultStatus,
    labName: stored.labName,
    collectedAt: stored.collectedAt,
    resultDate: stored.resultDate,
    healthRecordId: stored.healthRecordId,
    createdAt: stored.createdAt,
  };
}

// ─── Health Record Link Validation ────────────────────────────────────────────

export function validateHealthRecordLink(
  healthRecordId: string,
  nexusId: string
): { valid: boolean; reason?: string } {
  const record = findHealthRecordById(healthRecordId);
  if (!record) {
    return { valid: false, reason: "Health record document not found" };
  }
  if (record.nexusId !== nexusId) {
    return { valid: false, reason: "Health record belongs to another user" };
  }
  if (record.deletedAt) {
    return { valid: false, reason: "Health record has been deleted" };
  }
  if (record.category !== "LAB_REPORT") {
    return {
      valid: false,
      reason: "Referenced health record is not a lab report document",
    };
  }
  return { valid: true };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createLabResult(
  nexusId: string,
  input: CreateLabResultInput
): Promise<LabResult> {
  // Validate referenced lab report health record if provided
  if (input.healthRecordId) {
    const validation = validateHealthRecordLink(input.healthRecordId, nexusId);
    if (!validation.valid) {
      throw new Error(validation.reason || "Invalid health record reference");
    }
  }

  // Parse numericValue if not explicitly provided but value is numeric
  let numericValue = input.numericValue;
  if (numericValue === undefined && input.value) {
    const parsed = parseFloat(input.value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      numericValue = parsed;
    }
  }

  const params: CreateLabResultParams = {
    nexusId,
    testName: input.testName.trim(),
    category: input.category,
    value: input.value.trim(),
    numericValue,
    unit: input.unit?.trim() || undefined,
    referenceRangeMin: input.referenceRangeMin,
    referenceRangeMax: input.referenceRangeMax,
    referenceRangeText: input.referenceRangeText?.trim() || undefined,
    status: input.status,
    labName: input.labName?.trim() || undefined,
    collectedAt: input.collectedAt ? new Date(input.collectedAt) : undefined,
    resultDate: input.resultDate ? new Date(input.resultDate) : undefined,
    notes: input.notes?.trim() || undefined,
    healthRecordId: input.healthRecordId?.trim() || undefined,
  };

  const stored = storeCreate(params);

  void recordActivity(nexusId, {
    type: ActivityType.LAB_RESULT_RECEIVED,
    title: "Laboratory Result Recorded",
    description: "A new laboratory result was recorded.",
    entityType: "lab_result",
    entityId: stored.id,
  });

  return toLabResult(stored);
}

// ─── Read (single) ────────────────────────────────────────────────────────────

export async function getLabResult(
  id: string,
  nexusId: string
): Promise<LabResult | null> {
  const stored = findLabResultById(id);
  if (!stored) return null;
  // Strict user isolation
  if (stored.nexusId !== nexusId) return null;
  if (stored.deletedAt) return null;
  return toLabResult(stored);
}

// ─── Read (list with filters) ─────────────────────────────────────────────────

export async function listLabResults(
  nexusId: string,
  filters: LabFilters = {}
): Promise<LabListResponse> {
  const allStored = findLabResultsByUser(nexusId);

  let results = allStored;

  // Search filter
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(
      (item) =>
        item.testName.toLowerCase().includes(q) ||
        (item.labName && item.labName.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        item.value.toLowerCase().includes(q)
    );
  }

  // Category filter
  if (filters.category) {
    results = results.filter((item) => item.category === filters.category);
  }

  // Status filter
  if (filters.status) {
    results = results.filter((item) => item.status === filters.status);
  }

  // Sorting
  const sortBy = filters.sortBy || "resultDate";
  const sortOrder = filters.sortOrder || "desc";

  results.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "testName") {
      comparison = a.testName.localeCompare(b.testName);
    } else if (sortBy === "status") {
      comparison = a.status.localeCompare(b.status);
    } else if (sortBy === "createdAt") {
      comparison = a.createdAt.getTime() - b.createdAt.getTime();
    } else {
      // Default: resultDate (fallback to createdAt)
      const dateA = (a.resultDate || a.createdAt).getTime();
      const dateB = (b.resultDate || b.createdAt).getTime();
      comparison = dateA - dateB;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return {
    labs: results.map(toListItem),
    total: results.length,
    filters,
  };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateLabResult(
  id: string,
  nexusId: string,
  input: UpdateLabResultInput
): Promise<LabResult | null> {
  const existing = findLabResultById(id);
  if (!existing || existing.nexusId !== nexusId || existing.deletedAt) {
    return null;
  }

  // Validate referenced lab report health record if updated
  if (input.healthRecordId !== undefined && input.healthRecordId !== "") {
    const validation = validateHealthRecordLink(input.healthRecordId, nexusId);
    if (!validation.valid) {
      throw new Error(validation.reason || "Invalid health record reference");
    }
  }

  const updates: Partial<StoredLabResult> = {};

  if (input.testName !== undefined) updates.testName = input.testName.trim();
  if (input.category !== undefined) updates.category = input.category;
  if (input.value !== undefined) {
    updates.value = input.value.trim();
    // Auto calculate numericValue if not explicitly provided
    if (input.numericValue === undefined) {
      const parsed = parseFloat(input.value);
      updates.numericValue = !isNaN(parsed) && isFinite(parsed) ? parsed : undefined;
    }
  }
  if (input.numericValue !== undefined) updates.numericValue = input.numericValue;
  if (input.unit !== undefined) updates.unit = input.unit?.trim() || undefined;
  if (input.referenceRangeMin !== undefined) updates.referenceRangeMin = input.referenceRangeMin;
  if (input.referenceRangeMax !== undefined) updates.referenceRangeMax = input.referenceRangeMax;
  if (input.referenceRangeText !== undefined) updates.referenceRangeText = input.referenceRangeText?.trim() || undefined;
  if (input.status !== undefined) updates.status = input.status;
  if (input.labName !== undefined) updates.labName = input.labName?.trim() || undefined;
  if (input.collectedAt !== undefined) {
    updates.collectedAt = input.collectedAt ? new Date(input.collectedAt) : undefined;
  }
  if (input.resultDate !== undefined) {
    updates.resultDate = input.resultDate ? new Date(input.resultDate) : undefined;
  }
  if (input.notes !== undefined) updates.notes = input.notes?.trim() || undefined;
  if (input.healthRecordId !== undefined) {
    updates.healthRecordId = input.healthRecordId?.trim() || undefined;
  }

  const stored = storeUpdate(id, nexusId, updates);
  if (!stored) return null;
  return toLabResult(stored);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteLabResult(
  id: string,
  nexusId: string
): Promise<boolean> {
  return storeDelete(id, nexusId);
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export function getLabsSummary(nexusId: string): LabSummary {
  const items = findLabResultsByUser(nexusId);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let flaggedResults = 0;
  let recentCount = 0;
  let lastResultAt: Date | null = null;

  for (const item of items) {
    // Flagged results count ABNORMAL or CRITICAL
    if (item.status === "ABNORMAL" || item.status === "CRITICAL") {
      flaggedResults++;
    }

    const effectiveDate = item.resultDate || item.createdAt;
    if (effectiveDate >= thirtyDaysAgo) {
      recentCount++;
    }

    if (!lastResultAt || effectiveDate > lastResultAt) {
      lastResultAt = effectiveDate;
    }
  }

  return {
    totalResults: items.length,
    flaggedResults,
    recentCount,
    lastResultAt,
  };
}
