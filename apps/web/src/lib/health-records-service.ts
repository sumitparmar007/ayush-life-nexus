/**
 * Health Records Service
 *
 * Business logic layer for health record operations.
 * Sits between the API routes and the singleton store.
 * Each function is independently replaceable when real
 * storage/OCR/ABDM backends are implemented.
 */

import {
  createHealthRecord as storeCreate,
  findHealthRecordById,
  findHealthRecordsByUser,
  deleteHealthRecord as storeDelete,
  type StoredHealthRecord,
  type CreateHealthRecordParams,
} from "@/lib/store.ts";

import type {
  HealthRecord,
  HealthRecordListItem,
  HealthRecordListResponse,
  HealthRecordFilters,
  CreateHealthRecordInput,
  RecordCategory,
  RecordVerificationStatus,
} from "@/types/health-records.ts";

import type { MedicalRecordsSummary } from "@/types/dashboard.ts";
import { recordActivity } from "@/lib/activity-service.ts";
import { ActivityType } from "@/types/activity.ts";

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toHealthRecord(stored: StoredHealthRecord): HealthRecord {
  return {
    id: stored.id,
    nexusId: stored.nexusId,
    title: stored.title,
    category: stored.category as RecordCategory,
    source: stored.source as HealthRecord["source"],
    verificationStatus: stored.verificationStatus as RecordVerificationStatus,
    notes: stored.notes,
    issuedDate: stored.issuedDate,
    providerName: stored.providerName,
    fileName: stored.fileName,
    fileMimeType: stored.fileMimeType,
    fileSizeBytes: stored.fileSizeBytes,
    fileUrl: stored.fileUrl,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    deletedAt: stored.deletedAt,
  };
}

function toListItem(stored: StoredHealthRecord): HealthRecordListItem {
  return {
    id: stored.id,
    title: stored.title,
    category: stored.category as RecordCategory,
    source: stored.source as HealthRecordListItem["source"],
    verificationStatus: stored.verificationStatus as RecordVerificationStatus,
    fileName: stored.fileName,
    fileSizeBytes: stored.fileSizeBytes,
    issuedDate: stored.issuedDate,
    providerName: stored.providerName,
    createdAt: stored.createdAt,
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createRecord(
  nexusId: string,
  input: CreateHealthRecordInput
): Promise<HealthRecord> {
  const params: CreateHealthRecordParams = {
    nexusId,
    title: input.title,
    category: input.category,
    source: "UPLOADED", // In this phase, all records are user-uploaded
    fileName: input.fileName,
    fileMimeType: input.fileMimeType,
    fileSizeBytes: input.fileSizeBytes,
  };
  if (input.notes) params.notes = input.notes;
  if (input.issuedDate) params.issuedDate = new Date(input.issuedDate);
  if (input.providerName) params.providerName = input.providerName;

  const stored = storeCreate(params);

  void recordActivity(nexusId, {
    type: ActivityType.RECORD_ADDED,
    title: "Health Record Added",
    description: "A health record was added.",
    entityType: "health_record",
    entityId: stored.id,
  });

  return toHealthRecord(stored);
}

// ─── Get single ───────────────────────────────────────────────────────────────

export async function getRecord(
  id: string,
  nexusId: string
): Promise<HealthRecord | null> {
  const stored = findHealthRecordById(id);
  if (!stored || stored.nexusId !== nexusId || stored.deletedAt) return null;
  return toHealthRecord(stored);
}

// ─── List with filters ────────────────────────────────────────────────────────

export async function listRecords(
  nexusId: string,
  filters: HealthRecordFilters = {}
): Promise<HealthRecordListResponse> {
  let records = findHealthRecordsByUser(nexusId);

  // Apply category filter
  if (filters.category) {
    records = records.filter((r) => r.category === filters.category);
  }

  // Apply verification status filter
  if (filters.verificationStatus) {
    records = records.filter(
      (r) => r.verificationStatus === filters.verificationStatus
    );
  }

  // Apply search filter (title, provider name, file name)
  if (filters.search) {
    const q = filters.search.toLowerCase();
    records = records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.fileName.toLowerCase().includes(q) ||
        (r.providerName && r.providerName.toLowerCase().includes(q))
    );
  }

  // Apply sorting
  const sortBy = filters.sortBy ?? "createdAt";
  const sortOrder = filters.sortOrder ?? "desc";
  const multiplier = sortOrder === "asc" ? 1 : -1;

  records.sort((a, b) => {
    if (sortBy === "title") {
      return multiplier * a.title.localeCompare(b.title);
    }
    if (sortBy === "issuedDate") {
      const aTime = a.issuedDate?.getTime() ?? 0;
      const bTime = b.issuedDate?.getTime() ?? 0;
      return multiplier * (aTime - bTime);
    }
    // Default: createdAt
    return multiplier * (a.createdAt.getTime() - b.createdAt.getTime());
  });

  return {
    records: records.map(toListItem),
    total: records.length,
    filters,
  };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteRecord(
  id: string,
  nexusId: string
): Promise<boolean> {
  return storeDelete(id, nexusId);
}

// ─── Dashboard summary ───────────────────────────────────────────────────────
// Returns a MedicalRecordsSummary built from real data in the store.
// Replaces the mock in dashboard-service.ts.

export function getMedicalRecordsSummary(nexusId: string): MedicalRecordsSummary {
  const records = findHealthRecordsByUser(nexusId);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let uploaded = 0;
  let fetched = 0;
  let contributed = 0;
  let recentCount = 0;
  let pendingVerification = 0;
  let lastUpdatedAt: Date | null = null;

  for (const r of records) {
    // Source breakdown
    if (r.source === "UPLOADED") uploaded++;
    else if (r.source === "ABDM_FETCHED") fetched++;
    else if (r.source === "CONTRIBUTED") contributed++;

    // Recent (last 30 days)
    if (r.createdAt >= thirtyDaysAgo) recentCount++;

    // Pending verification
    if (r.verificationStatus === "PENDING") pendingVerification++;

    // Last updated
    if (!lastUpdatedAt || r.updatedAt > lastUpdatedAt) {
      lastUpdatedAt = r.updatedAt;
    }
  }

  return {
    totalRecords: records.length,
    recentCount,
    pendingVerification,
    lastUpdatedAt,
    sourceBreakdown: { uploaded, fetched, contributed },
  };
}
