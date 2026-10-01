/**
 * Consent Service
 *
 * Business logic layer for Consent & Privacy operations.
 * Sits between API routes and the singleton store.
 */

import {
  createConsent as storeCreate,
  findConsentById,
  findConsentsByUser,
  findConsentsByRecipient,
  findConsentsByDoctorAndPatient,
  findActiveConsent,
  updateConsent as storeUpdate,
  approveConsent as storeApprove,
  rejectConsent as storeReject,
  revokeConsent as storeRevoke,
  deleteConsent as storeDelete,
  findUserById,
  findDoctorProfile,
  type StoredConsent,
  type CreateConsentParams,
} from "@/lib/store.ts";

import type {
  ConsentRecord,
  ConsentListItem,
  ConsentListResponse,
  ConsentFilters,
  CreateConsentInput,
  UpdateConsentInput,
  ConsentStatus,
  ConsentRecipientType,
  ConsentPurpose,
  ConsentDataScope,
  ConsentPermission,
} from "@/types/consent.ts";

import type { ConsentSummary } from "@/types/dashboard.ts";
import { recordActivity } from "@/lib/activity-service.ts";
import { ActivityType } from "@/types/activity.ts";

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toConsentRecord(stored: StoredConsent): ConsentRecord {
  return {
    id: stored.id,
    nexusId: stored.nexusId,
    recipientNexusId: stored.recipientNexusId,
    recipientName: stored.recipientName,
    recipientType: stored.recipientType as ConsentRecipientType,
    organizationName: stored.organizationName,
    purpose: stored.purpose as ConsentPurpose,
    dataScopes: stored.dataScopes as ConsentDataScope[],
    permission: stored.permission as ConsentPermission,
    status: stored.status as ConsentStatus,
    grantedAt: stored.grantedAt,
    revokedAt: stored.revokedAt,
    expiresAt: stored.expiresAt,
    notes: stored.notes,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    deletedAt: stored.deletedAt,
  };
}

function toListItem(stored: StoredConsent): ConsentListItem {
  return {
    id: stored.id,
    nexusId: stored.nexusId,
    recipientNexusId: stored.recipientNexusId,
    recipientName: stored.recipientName,
    recipientType: stored.recipientType as ConsentRecipientType,
    organizationName: stored.organizationName,
    purpose: stored.purpose as ConsentPurpose,
    dataScopes: stored.dataScopes as ConsentDataScope[],
    permission: stored.permission as ConsentPermission,
    status: stored.status as ConsentStatus,
    grantedAt: stored.grantedAt,
    revokedAt: stored.revokedAt,
    expiresAt: stored.expiresAt,
    createdAt: stored.createdAt,
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createConsent(
  nexusId: string,
  input: CreateConsentInput
): Promise<ConsentRecord> {
  const params: CreateConsentParams = {
    nexusId,
    recipientNexusId: input.recipientNexusId,
    recipientName: input.recipientName.trim(),
    recipientType: input.recipientType,
    organizationName: input.organizationName?.trim() || undefined,
    purpose: input.purpose,
    dataScopes: input.dataScopes,
    permission: input.permission,
    status: input.status || "ACTIVE",
    expiresAt: new Date(input.expiresAt),
    notes: input.notes?.trim() || undefined,
  };

  const stored = storeCreate(params);

  // If created directly as ACTIVE, record CONSENT_GRANTED.
  // If created as PENDING_APPROVAL, wait until user approves it.
  if (stored.status === "ACTIVE") {
    void recordActivity(nexusId, {
      type: ActivityType.CONSENT_GRANTED,
      title: "Consent Access Granted",
      description: "Health data access was granted.",
      entityType: "consent",
      entityId: stored.id,
    });
  }

  return toConsentRecord(stored);
}

// ─── Read (single) ────────────────────────────────────────────────────────────

export async function getConsent(
  id: string,
  nexusId: string
): Promise<ConsentRecord | null> {
  const stored = findConsentById(id);
  if (!stored) return null;
  // User isolation: allow if patient owner OR if recipient doctor
  if (stored.nexusId !== nexusId && stored.recipientNexusId !== nexusId) {
    return null;
  }
  if (stored.deletedAt) return null;
  return toConsentRecord(stored);
}

// ─── Read (list with filters for Patient) ──────────────────────────────────────

export async function listConsents(
  nexusId: string,
  filters: ConsentFilters = {}
): Promise<ConsentListResponse> {
  const allStored = findConsentsByUser(nexusId);

  let results = allStored;

  // Search filter (recipientName, organizationName, notes)
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(
      (item) =>
        item.recipientName.toLowerCase().includes(q) ||
        (item.organizationName &&
          item.organizationName.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q))
    );
  }

  // Status filter
  if (filters.status) {
    results = results.filter((item) => item.status === filters.status);
  }

  // Recipient type filter
  if (filters.recipientType) {
    results = results.filter(
      (item) => item.recipientType === filters.recipientType
    );
  }

  // Sorting
  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder || "desc";

  results.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "recipientName") {
      comparison = a.recipientName.localeCompare(b.recipientName);
    } else if (sortBy === "expiresAt") {
      comparison = a.expiresAt.getTime() - b.expiresAt.getTime();
    } else if (sortBy === "status") {
      comparison = a.status.localeCompare(b.status);
    } else {
      // Default: createdAt desc
      comparison = a.createdAt.getTime() - b.createdAt.getTime();
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return {
    consents: results.map(toListItem),
    total: results.length,
    filters,
  };
}

// ─── Read (list with filters for Doctor) ───────────────────────────────────────

export interface DoctorConsentListItem extends ConsentListItem {
  patientName: string;
}

export interface DoctorConsentListResponse {
  consents: DoctorConsentListItem[];
  total: number;
  filters: ConsentFilters;
}

export async function listConsentsForDoctor(
  doctorNexusId: string,
  filters: ConsentFilters = {}
): Promise<DoctorConsentListResponse> {
  const allStored = findConsentsByRecipient(doctorNexusId);

  let results = allStored;

  // Filter by status if provided
  if (filters.status) {
    results = results.filter((item) => item.status === filters.status);
  }

  // Search filter (patient display name or notes)
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter((item) => {
      const patient = findUserById(item.nexusId);
      const patientName = patient?.displayName?.toLowerCase() || "";
      return (
        patientName.includes(q) ||
        item.nexusId.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    });
  }

  // Sorting
  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder || "desc";

  results.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "expiresAt") {
      comparison = a.expiresAt.getTime() - b.expiresAt.getTime();
    } else if (sortBy === "status") {
      comparison = a.status.localeCompare(b.status);
    } else {
      comparison = a.createdAt.getTime() - b.createdAt.getTime();
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const formatted: DoctorConsentListItem[] = results.map((item) => {
    const patient = findUserById(item.nexusId);
    return {
      ...toListItem(item),
      patientName: patient?.displayName || "Patient",
    };
  });

  return {
    consents: formatted,
    total: formatted.length,
    filters,
  };
}

// ─── Doctor Creates Consent Request ───────────────────────────────────────────

export interface DoctorConsentRequestInput {
  patientNexusId: string;
  dataScopes: ConsentDataScope[];
  permission?: ConsentPermission;
  purpose?: ConsentPurpose;
  expiresAt: string; // ISO Date string
  notes?: string;
}

export async function createDoctorConsentRequest(
  doctorNexusId: string,
  input: DoctorConsentRequestInput
): Promise<{ consent: ConsentRecord; error?: never } | { consent?: never; error: string; code: string; status: number }> {
  // 1. Verify doctor identity
  const doctorUser = findUserById(doctorNexusId);
  if (!doctorUser || doctorUser.role !== "DOCTOR") {
    return { error: "Only registered doctors can request patient consent", code: "FORBIDDEN", status: 403 };
  }

  // 2. Verify target patient
  const targetPatient = findUserById(input.patientNexusId);
  if (!targetPatient || targetPatient.role !== "PATIENT") {
    return { error: "Target patient not found", code: "PATIENT_NOT_FOUND", status: 404 };
  }

  // 3. Self-targeting check
  if (doctorNexusId === input.patientNexusId) {
    return { error: "Cannot request consent from yourself", code: "INVALID_TARGET", status: 400 };
  }

  // 4. Check for duplicate pending requests
  const existingConsents = findConsentsByDoctorAndPatient(doctorNexusId, input.patientNexusId);
  const pending = existingConsents.find((c) => c.status === "PENDING_APPROVAL");
  if (pending) {
    return {
      error: "A pending consent request already exists for this patient",
      code: "DUPLICATE_PENDING_REQUEST",
      status: 409,
    };
  }

  // 5. Check if already active
  const active = findActiveConsent(doctorNexusId, input.patientNexusId);
  if (active) {
    return {
      error: "An active consent authorization is already granted by this patient",
      code: "ACTIVE_CONSENT_EXISTS",
      status: 409,
    };
  }

  // 6. Look up doctor profile for practice details
  const doctorProfile = findDoctorProfile(doctorNexusId);
  const doctorName = doctorUser.displayName || "Doctor";
  const formattedDoctorName = doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`;
  const clinicName = doctorProfile?.clinicName || undefined;

  // 7. Create consent in store as PENDING_APPROVAL
  const params: CreateConsentParams = {
    nexusId: input.patientNexusId, // Owned by patient
    recipientNexusId: doctorNexusId,
    recipientName: formattedDoctorName,
    recipientType: "DOCTOR",
    organizationName: clinicName,
    purpose: input.purpose || "DIRECT_CARE",
    dataScopes: input.dataScopes,
    permission: input.permission || "VIEW_ONLY",
    status: "PENDING_APPROVAL", // Always pending approval when created by doctor
    expiresAt: new Date(input.expiresAt),
    notes: input.notes?.trim() || undefined,
  };

  const stored = storeCreate(params);

  // 8. Record audit activity for the patient
  void recordActivity(input.patientNexusId, {
    type: ActivityType.CONSENT_REQUESTED,
    title: "New Doctor Access Request",
    description: `${formattedDoctorName} requested access to your health data.`,
    entityType: "consent",
    entityId: stored.id,
  });

  // 9. Record audit activity for the requesting doctor
  void recordActivity(doctorNexusId, {
    type: ActivityType.CONSENT_REQUESTED,
    title: "Consent Request Sent",
    description: `Requested health data access from ${targetPatient.displayName || "Patient"}.`,
    entityType: "consent",
    entityId: stored.id,
  });

  return { consent: toConsentRecord(stored) };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateConsent(
  id: string,
  nexusId: string,
  input: UpdateConsentInput
): Promise<ConsentRecord | null> {
  const existing = findConsentById(id);
  if (!existing || existing.nexusId !== nexusId || existing.deletedAt) {
    return null;
  }

  const updates: Partial<StoredConsent> = {};

  if (input.recipientNexusId !== undefined) {
    updates.recipientNexusId = input.recipientNexusId;
  }
  if (input.recipientName !== undefined) {
    updates.recipientName = input.recipientName.trim();
  }
  if (input.recipientType !== undefined) {
    updates.recipientType = input.recipientType;
  }
  if (input.organizationName !== undefined) {
    updates.organizationName = input.organizationName?.trim() || undefined;
  }
  if (input.purpose !== undefined) {
    updates.purpose = input.purpose;
  }
  if (input.dataScopes !== undefined) {
    updates.dataScopes = input.dataScopes;
  }
  if (input.permission !== undefined) {
    updates.permission = input.permission;
  }
  if (input.status !== undefined) {
    updates.status = input.status;
  }
  if (input.expiresAt !== undefined) {
    updates.expiresAt = new Date(input.expiresAt);
  }
  if (input.notes !== undefined) {
    updates.notes = input.notes?.trim() || undefined;
  }

  const stored = storeUpdate(id, nexusId, updates);
  if (!stored) return null;
  return toConsentRecord(stored);
}

// ─── Approve (Pending Request) ────────────────────────────────────────────────

export async function approveConsent(
  id: string,
  nexusId: string
): Promise<ConsentRecord | null> {
  const stored = storeApprove(id, nexusId);
  if (!stored) return null;

  void recordActivity(nexusId, {
    type: ActivityType.CONSENT_GRANTED,
    title: "Consent Access Granted",
    description: `Health data access was approved for ${stored.recipientName}.`,
    entityType: "consent",
    entityId: stored.id,
  });

  if (stored.recipientType === "DOCTOR" && stored.recipientNexusId) {
    const patient = findUserById(nexusId);
    void recordActivity(stored.recipientNexusId, {
      type: ActivityType.CONSENT_GRANTED,
      title: "Consent Access Approved",
      description: `Health data access was approved by ${patient?.displayName || "Patient"}.`,
      entityType: "consent",
      entityId: stored.id,
    });
  }

  return toConsentRecord(stored);
}

// ─── Reject (Pending Request) ─────────────────────────────────────────────────

export async function rejectConsent(
  id: string,
  nexusId: string
): Promise<ConsentRecord | null> {
  const stored = storeReject(id, nexusId);
  if (!stored) return null;

  void recordActivity(nexusId, {
    type: ActivityType.CONSENT_REJECTED,
    title: "Consent Request Declined",
    description: `Health data access request from ${stored.recipientName} was declined.`,
    entityType: "consent",
    entityId: stored.id,
  });

  if (stored.recipientType === "DOCTOR" && stored.recipientNexusId) {
    const patient = findUserById(nexusId);
    void recordActivity(stored.recipientNexusId, {
      type: ActivityType.CONSENT_REJECTED,
      title: "Consent Request Declined",
      description: `Health data access request was declined by ${patient?.displayName || "Patient"}.`,
      entityType: "consent",
      entityId: stored.id,
    });
  }

  return toConsentRecord(stored);
}

// ─── Revoke ───────────────────────────────────────────────────────────────────

export async function revokeConsent(
  id: string,
  nexusId: string
): Promise<ConsentRecord | null> {
  const stored = storeRevoke(id, nexusId);
  if (!stored) return null;

  void recordActivity(nexusId, {
    type: ActivityType.CONSENT_REVOKED,
    title: "Consent Access Revoked",
    description: `Health data access was revoked for ${stored.recipientName}.`,
    entityType: "consent",
    entityId: stored.id,
  });

  if (stored.recipientType === "DOCTOR" && stored.recipientNexusId) {
    const patient = findUserById(nexusId);
    void recordActivity(stored.recipientNexusId, {
      type: ActivityType.CONSENT_REVOKED,
      title: "Consent Access Revoked",
      description: `Health data access was revoked by ${patient?.displayName || "Patient"}.`,
      entityType: "consent",
      entityId: stored.id,
    });
  }

  return toConsentRecord(stored);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteConsent(
  id: string,
  nexusId: string
): Promise<boolean> {
  return storeDelete(id, nexusId);
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export function getConsentSummary(nexusId: string): ConsentSummary {
  const consents = findConsentsByUser(nexusId);

  let activeConsents = 0;
  let pendingRequests = 0;
  let lastActivityAt: Date | null = null;

  const now = new Date();

  for (const c of consents) {
    if (c.status === "ACTIVE" && c.expiresAt.getTime() >= now.getTime()) {
      activeConsents++;
    } else if (c.status === "PENDING_APPROVAL" && c.expiresAt.getTime() >= now.getTime()) {
      pendingRequests++;
    }

    // Find the latest activity timestamp
    const activityTimestamps = [
      c.createdAt,
      c.updatedAt,
      c.grantedAt,
      c.revokedAt,
    ].filter((d): d is Date => d instanceof Date);

    for (const d of activityTimestamps) {
      if (!lastActivityAt || d > lastActivityAt) {
        lastActivityAt = d;
      }
    }
  }

  return {
    activeConsents,
    pendingRequests,
    lastActivityAt,
  };
}
