/**
 * Medications Service
 *
 * Business logic layer for medication operations.
 * Sits between API routes and the singleton store.
 */

import {
  createMedication as storeCreate,
  findMedicationById,
  findMedicationsByUser,
  updateMedication as storeUpdate,
  deleteMedication as storeDelete,
  findHealthRecordById,
  findUserById,
  findDoctorProfile,
  type StoredMedication,
  type CreateMedicationParams,
} from "@/lib/store.ts";

import type {
  Medication,
  MedicationListItem,
  MedicationListResponse,
  MedicationFilters,
  CreateMedicationInput,
  UpdateMedicationInput,
  MedicationStatus,
  MedicationFrequency,
  MedicationRoute,
  PrescriberProfile,
} from "@/types/medications.ts";

import type { MedicationSummary } from "@/types/dashboard.ts";
import { recordActivity } from "@/lib/activity-service.ts";
import { ActivityType } from "@/types/activity.ts";
import { canDoctorAccessPatient } from "@/lib/doctor-authorization.ts";
import { ConsentDataScope } from "@/types/consent.ts";

// ─── Mappers ──────────────────────────────────────────────────────────────────

function getPrescriberProfile(prescribedByNexusId?: string | null): PrescriberProfile | null {
  if (!prescribedByNexusId) return null;
  const doc = findUserById(prescribedByNexusId);
  if (!doc) return null;
  const profile = findDoctorProfile(prescribedByNexusId);
  const rawName = doc.displayName || "Doctor";
  const displayName = rawName.startsWith("Dr.") ? rawName : `Dr. ${rawName}`;
  return {
    doctorNexusId: prescribedByNexusId,
    displayName,
    specialization: profile?.specialization,
    clinicName: profile?.clinicName,
  };
}

function toMedication(stored: StoredMedication): Medication {
  const prescriberProfile = getPrescriberProfile(stored.prescribedByNexusId);
  return {
    id: stored.id,
    nexusId: stored.nexusId,
    name: stored.name,
    dosage: stored.dosage,
    dosageUnit: stored.dosageUnit,
    frequency: stored.frequency as MedicationFrequency,
    route: stored.route as MedicationRoute,
    instructions: stored.instructions,
    prescribedBy: stored.prescribedBy,
    prescribedByNexusId: stored.prescribedByNexusId,
    prescriberProfile,
    startDate: stored.startDate,
    endDate: stored.endDate,
    refillsRemaining: stored.refillsRemaining,
    prescriptionRecordId: stored.prescriptionRecordId,
    status: stored.status as MedicationStatus,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    deletedAt: stored.deletedAt,
  };
}

function toListItem(stored: StoredMedication): MedicationListItem {
  const prescriberProfile = getPrescriberProfile(stored.prescribedByNexusId);
  return {
    id: stored.id,
    name: stored.name,
    dosage: stored.dosage,
    dosageUnit: stored.dosageUnit,
    frequency: stored.frequency as MedicationFrequency,
    route: stored.route as MedicationRoute,
    status: stored.status as MedicationStatus,
    prescribedBy: stored.prescribedBy,
    prescribedByNexusId: stored.prescribedByNexusId,
    prescriberProfile,
    startDate: stored.startDate,
    endDate: stored.endDate,
    refillsRemaining: stored.refillsRemaining,
    prescriptionRecordId: stored.prescriptionRecordId,
    createdAt: stored.createdAt,
  };
}

// ─── Prescription Link Validation ─────────────────────────────────────────────

export function validatePrescriptionRecord(
  prescriptionRecordId: string,
  nexusId: string
): { valid: boolean; reason?: string } {
  const record = findHealthRecordById(prescriptionRecordId);
  if (!record) {
    return { valid: false, reason: "Prescription record not found" };
  }
  if (record.nexusId !== nexusId) {
    return { valid: false, reason: "Prescription record belongs to another user" };
  }
  if (record.deletedAt) {
    return { valid: false, reason: "Prescription record has been deleted" };
  }
  if (record.category !== "PRESCRIPTION") {
    return {
      valid: false,
      reason: "Referenced health record is not a prescription document",
    };
  }
  return { valid: true };
}

// ─── Create (Patient-Initiated) ───────────────────────────────────────────────

export async function createMedication(
  nexusId: string,
  input: CreateMedicationInput
): Promise<Medication> {
  // Validate optional prescription record link
  if (input.prescriptionRecordId) {
    const val = validatePrescriptionRecord(input.prescriptionRecordId, nexusId);
    if (!val.valid) {
      throw new Error(val.reason || "Invalid prescription reference");
    }
  }

  const params: CreateMedicationParams = {
    nexusId,
    name: input.name,
    dosage: input.dosage,
    dosageUnit: input.dosageUnit,
    frequency: input.frequency,
    route: input.route,
    instructions: input.instructions,
    prescribedBy: input.prescribedBy,
    prescribedByNexusId: input.prescribedByNexusId,
    refillsRemaining: input.refillsRemaining,
    prescriptionRecordId: input.prescriptionRecordId,
    status: input.status || "ACTIVE",
  };

  if (input.startDate) params.startDate = new Date(input.startDate);
  if (input.endDate) params.endDate = new Date(input.endDate);

  const stored = storeCreate(params);

  void recordActivity(nexusId, {
    type: ActivityType.MEDICATION_DISPENSED,
    title: "Medication Added",
    description: "A medication was added to your health profile.",
    entityType: "medication",
    entityId: stored.id,
  });

  return toMedication(stored);
}

// ─── Create Doctor Prescription (Phase 11E) ───────────────────────────────────

export async function createDoctorPrescription(
  doctorNexusId: string,
  patientNexusId: string,
  input: CreateMedicationInput
): Promise<Medication> {
  // 1. Centralized Security Authorization
  const auth = canDoctorAccessPatient(
    doctorNexusId,
    patientNexusId,
    ConsentDataScope.PRESCRIPTIONS
  );

  if (!auth.allowed) {
    throw new Error(auth.reason || "Doctor does not have authorized prescription consent for this patient");
  }

  const doctorUser = findUserById(doctorNexusId);
  const patientUser = findUserById(patientNexusId);
  if (!doctorUser || doctorUser.role !== "DOCTOR") {
    throw new Error("Invalid doctor identity");
  }
  if (!patientUser || patientUser.role !== "PATIENT") {
    throw new Error("Invalid patient identity");
  }

  // Validate dates order if both provided
  if (input.startDate && input.endDate) {
    const s = new Date(input.startDate).getTime();
    const e = new Date(input.endDate).getTime();
    if (isNaN(s) || isNaN(e)) {
      throw new Error("Invalid date format");
    }
    if (e < s) {
      throw new Error("End date cannot precede start date");
    }
  } else if (input.startDate && isNaN(new Date(input.startDate).getTime())) {
    throw new Error("Invalid start date format");
  } else if (input.endDate && isNaN(new Date(input.endDate).getTime())) {
    throw new Error("Invalid end date format");
  }

  // Validate optional prescription record link (must belong to the patient)
  if (input.prescriptionRecordId) {
    const val = validatePrescriptionRecord(input.prescriptionRecordId, patientNexusId);
    if (!val.valid) {
      throw new Error(val.reason || "Invalid prescription reference");
    }
  }

  const docRawName = doctorUser.displayName || "Doctor";
  const formattedDoctorName = docRawName.startsWith("Dr.") ? docRawName : `Dr. ${docRawName}`;
  const patientName = patientUser.displayName || "Patient";

  const params: CreateMedicationParams = {
    nexusId: patientNexusId,
    name: input.name,
    dosage: input.dosage,
    dosageUnit: input.dosageUnit,
    frequency: input.frequency,
    route: input.route,
    instructions: input.instructions,
    prescribedBy: formattedDoctorName,
    prescribedByNexusId: doctorNexusId,
    refillsRemaining: input.refillsRemaining,
    prescriptionRecordId: input.prescriptionRecordId,
    status: input.status || "ACTIVE",
  };

  if (input.startDate) params.startDate = new Date(input.startDate);
  if (input.endDate) params.endDate = new Date(input.endDate);

  const stored = storeCreate(params);

  // 2. Privacy-first activity logging for Patient
  void recordActivity(patientNexusId, {
    type: ActivityType.PRESCRIPTION_CREATED,
    title: "Prescription Received",
    description: `${formattedDoctorName} prescribed a medication.`,
    entityType: "medication",
    entityId: stored.id,
  });

  // 3. Privacy-first activity logging for Doctor
  void recordActivity(doctorNexusId, {
    type: ActivityType.PRESCRIPTION_CREATED,
    title: "Prescription Created",
    description: `Prescribed medication for ${patientName}.`,
    entityType: "medication",
    entityId: stored.id,
  });

  return toMedication(stored);
}

// ─── Get single ───────────────────────────────────────────────────────────────

export async function getMedication(
  id: string,
  nexusId: string
): Promise<Medication | null> {
  const stored = findMedicationById(id);
  if (!stored || stored.nexusId !== nexusId || stored.deletedAt) return null;
  return toMedication(stored);
}

// ─── List with filters ────────────────────────────────────────────────────────

export async function listMedications(
  nexusId: string,
  filters: MedicationFilters = {}
): Promise<MedicationListResponse> {
  let items = findMedicationsByUser(nexusId);

  // Apply status filter
  if (filters.status) {
    items = items.filter((m) => m.status === filters.status);
  }

  // Apply search filter (name, instructions, prescribedBy, dosage)
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.instructions && m.instructions.toLowerCase().includes(q)) ||
        (m.prescribedBy && m.prescribedBy.toLowerCase().includes(q)) ||
        `${m.dosage} ${m.dosageUnit}`.toLowerCase().includes(q)
    );
  }

  // Apply sorting
  const sortBy = filters.sortBy ?? "createdAt";
  const sortOrder = filters.sortOrder ?? "desc";
  const multiplier = sortOrder === "asc" ? 1 : -1;

  items.sort((a, b) => {
    if (sortBy === "name") {
      return multiplier * a.name.localeCompare(b.name);
    }
    if (sortBy === "startDate") {
      const aTime = a.startDate?.getTime() ?? 0;
      const bTime = b.startDate?.getTime() ?? 0;
      return multiplier * (aTime - bTime);
    }
    // Default: createdAt
    return multiplier * (a.createdAt.getTime() - b.createdAt.getTime());
  });

  return {
    medications: items.map(toListItem),
    total: items.length,
    filters,
  };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateMedication(
  id: string,
  nexusId: string,
  input: UpdateMedicationInput
): Promise<Medication | null> {
  const existing = findMedicationById(id);
  if (!existing || existing.nexusId !== nexusId || existing.deletedAt) {
    return null;
  }

  // Validate optional prescription record link if updating
  if (input.prescriptionRecordId) {
    const val = validatePrescriptionRecord(input.prescriptionRecordId, nexusId);
    if (!val.valid) {
      throw new Error(val.reason || "Invalid prescription reference");
    }
  }

  const updates: Parameters<typeof storeUpdate>[2] = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.dosage !== undefined) updates.dosage = input.dosage;
  if (input.dosageUnit !== undefined) updates.dosageUnit = input.dosageUnit;
  if (input.frequency !== undefined) updates.frequency = input.frequency;
  if (input.route !== undefined) updates.route = input.route;
  if (input.instructions !== undefined) updates.instructions = input.instructions;
  if (input.prescribedBy !== undefined) updates.prescribedBy = input.prescribedBy;
  if (input.startDate !== undefined) updates.startDate = input.startDate ? new Date(input.startDate) : undefined;
  if (input.endDate !== undefined) updates.endDate = input.endDate ? new Date(input.endDate) : undefined;
  if (input.refillsRemaining !== undefined) updates.refillsRemaining = input.refillsRemaining;
  if (input.prescriptionRecordId !== undefined) updates.prescriptionRecordId = input.prescriptionRecordId || undefined;
  if (input.status !== undefined) updates.status = input.status;

  const stored = storeUpdate(id, nexusId, updates);
  if (!stored) return null;
  return toMedication(stored);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteMedication(
  id: string,
  nexusId: string
): Promise<boolean> {
  return storeDelete(id, nexusId);
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export function getMedicationsSummary(nexusId: string): MedicationSummary {
  const items = findMedicationsByUser(nexusId);

  let activeMedications = 0;
  let pendingRefills = 0;
  let lastUpdatedAt: Date | null = null;

  for (const m of items) {
    if (m.status === "ACTIVE") {
      activeMedications++;
      if (m.refillsRemaining && m.refillsRemaining > 0) {
        pendingRefills += m.refillsRemaining;
      }
    }

    if (!lastUpdatedAt || m.updatedAt > lastUpdatedAt) {
      lastUpdatedAt = m.updatedAt;
    }
  }

  return {
    activeMedications,
    adherenceRate: null, // As specified, adherence rate remains null in Phase 5
    pendingRefills,
    lastUpdatedAt,
  };
}
