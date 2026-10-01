/**
 * In-process singleton store.
 *
 * Three Maps live at module scope — same import path always resolves
 * to the same module instance within one Node.js process, so the same
 * Maps are shared across every API route handler and server layout call
 * in the same process.
 *
 * Production replacement: swap each Map for Redis calls behind the same
 * interface without touching any caller.
 */

import { randomUUID } from "crypto";
import { createHash, randomInt } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredUser {
  nexusId: string;
  phoneHash: string;
  role: "PATIENT" | "CAREGIVER" | "ADMIN" | "DOCTOR";
  trustLevel: 1 | 2 | 3 | 4 | 5;
  authMode: "MODE_A" | "MODE_B";
  abhaLinked: boolean;
  abhaId?: string | undefined;
  displayName?: string | undefined;
  email?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredSession {
  sessionId: string;
  nexusId: string;
  trustLevel: 1 | 2 | 3 | 4 | 5;
  authMode: "MODE_A" | "MODE_B";
  issuedAt: number;
  expiresAt: number;
}

export interface StoredOtp {
  otpHash: string;
  phoneHash: string;
  expiresAt: number;
  attemptsRemaining: number;
  consumed: boolean;
}

export interface StoredHealthRecord {
  id: string;
  nexusId: string;
  title: string;
  category: string;
  source: string;
  verificationStatus: string;
  notes?: string | undefined;
  issuedDate?: Date | undefined;
  providerName?: string | undefined;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
  fileUrl: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

export interface StoredMedication {
  id: string;
  nexusId: string;
  name: string;
  dosage: string;
  dosageUnit: string;
  frequency: string;
  route: string;
  instructions?: string | undefined;
  prescribedBy?: string | undefined;
  prescribedByNexusId?: string | null | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  refillsRemaining?: number | undefined;
  prescriptionRecordId?: string | undefined;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

export interface StoredLabResult {
  id: string;
  nexusId: string;
  testName: string;
  category: string;
  value: string;
  numericValue?: number | undefined;
  unit?: string | undefined;
  referenceRangeMin?: number | undefined;
  referenceRangeMax?: number | undefined;
  referenceRangeText?: string | undefined;
  status: string;
  labName?: string | undefined;
  collectedAt?: Date | undefined;
  resultDate?: Date | undefined;
  notes?: string | undefined;
  healthRecordId?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

export interface StoredInsurancePolicy {
  id: string;
  nexusId: string;
  policyNumber: string;
  providerName: string;
  policyName: string;
  policyType: string;
  sumInsured: number;
  premiumAmount?: number | undefined;
  startDate?: Date | undefined;
  expiryDate: Date;
  status: string;
  tpaName?: string | undefined;
  tpaContact?: string | undefined;
  networkHospitalUrl?: string | undefined;
  policyDocumentRecordId?: string | undefined;
  notes?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

export interface StoredConsent {
  id: string;
  nexusId: string;
  recipientNexusId?: string | undefined;
  recipientName: string;
  recipientType: string;
  organizationName?: string | undefined;
  purpose: string;
  dataScopes: string[];
  permission: string;
  status: string;
  grantedAt?: Date | undefined;
  revokedAt?: Date | undefined;
  expiresAt: Date;
  notes?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | undefined;
}

export interface StoredActivity {
  id: string;
  nexusId: string;
  type: string;
  title: string;
  description: string;
  isRead: boolean;
  entityType?: string | undefined;
  entityId?: string | undefined;
  timestamp: Date;
  createdAt: Date;
}

export interface StoredDoctorProfile {
  nexusId: string;
  registrationNumber?: string | undefined;
  specialization?: string | undefined;
  qualifications?: string | undefined;
  clinicName?: string | undefined;
  consultationAddress?: string | undefined;
  consultationPhone?: string | undefined;
  profileStatus: "INCOMPLETE" | "ACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

// ─── Singleton maps ───────────────────────────────────────────────────────────
// Attach to globalThis so the Maps survive Next.js HMR in dev mode.
// In production the module is only evaluated once so this is a no-op wrapper.

interface NexusStoreGlobal {
  __nexus_usersByNexusId?: Map<string, StoredUser>;
  __nexus_usersByPhoneHash?: Map<string, StoredUser>;
  __nexus_sessions?: Map<string, StoredSession>;
  __nexus_deniedSessions?: Set<string>;
  __nexus_otps?: Map<string, StoredOtp>;
  __nexus_healthRecords?: Map<string, StoredHealthRecord>;
  __nexus_healthRecordsByUser?: Map<string, Set<string>>;
  __nexus_medications?: Map<string, StoredMedication>;
  __nexus_medicationsByUser?: Map<string, Set<string>>;
  __nexus_labResults?: Map<string, StoredLabResult>;
  __nexus_labResultsByUser?: Map<string, Set<string>>;
  __nexus_insurancePolicies?: Map<string, StoredInsurancePolicy>;
  __nexus_insurancePoliciesByUser?: Map<string, Set<string>>;
  __nexus_consents?: Map<string, StoredConsent>;
  __nexus_consentsByUser?: Map<string, Set<string>>;
  __nexus_consentsByRecipient?: Map<string, Set<string>>;
  __nexus_activities?: Map<string, StoredActivity>;
  __nexus_activitiesByUser?: Map<string, Set<string>>;
  __nexus_doctorProfiles?: Map<string, StoredDoctorProfile>;
}

const g = globalThis as unknown as NexusStoreGlobal;

const usersByNexusId  = (g.__nexus_usersByNexusId  ??= new Map<string, StoredUser>());
const usersByPhoneHash = (g.__nexus_usersByPhoneHash ??= new Map<string, StoredUser>());
const sessions        = (g.__nexus_sessions        ??= new Map<string, StoredSession>());
const deniedSessions  = (g.__nexus_deniedSessions  ??= new Set<string>());
const otps            = (g.__nexus_otps            ??= new Map<string, StoredOtp>());
const healthRecords   = (g.__nexus_healthRecords   ??= new Map<string, StoredHealthRecord>());
const healthRecordsByUser = (g.__nexus_healthRecordsByUser ??= new Map<string, Set<string>>());
const medications     = (g.__nexus_medications     ??= new Map<string, StoredMedication>());
const medicationsByUser = (g.__nexus_medicationsByUser ??= new Map<string, Set<string>>());
const labResults      = (g.__nexus_labResults      ??= new Map<string, StoredLabResult>());
const labResultsByUser = (g.__nexus_labResultsByUser ??= new Map<string, Set<string>>());
const insurancePolicies = (g.__nexus_insurancePolicies ??= new Map<string, StoredInsurancePolicy>());
const insurancePoliciesByUser = (g.__nexus_insurancePoliciesByUser ??= new Map<string, Set<string>>());
const consents        = (g.__nexus_consents        ??= new Map<string, StoredConsent>());
const consentsByUser  = (g.__nexus_consentsByUser  ??= new Map<string, Set<string>>());
const consentsByRecipient = (g.__nexus_consentsByRecipient ??= new Map<string, Set<string>>());
const activities      = (g.__nexus_activities      ??= new Map<string, StoredActivity>());
const activitiesByUser = (g.__nexus_activitiesByUser ??= new Map<string, Set<string>>());
const doctorProfiles   = (g.__nexus_doctorProfiles   ??= new Map<string, StoredDoctorProfile>());

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hashPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return createHash("sha256").update(`nexus:phone:${digits}`).digest("hex");
}

function hashOtpValue(otp: string): string {
  return createHash("sha256").update(`nexus:otp:${otp}`).digest("hex");
}

// ─── OTP operations ───────────────────────────────────────────────────────────

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 3;

export interface OtpIssuance {
  requestId: string;
  maskedPhone: string;
  expiresInSeconds: number;
  /** Only populated in development — never send to prod clients */
  _devOtp?: string;
}

export function issueOtp(phone: string): OtpIssuance {
  const phoneHash = hashPhone(phone);
  const otp = process.env.NODE_ENV === "development"
    ? "123456"
    : String(randomInt(100_000, 999_999));
  const requestId = `otp_${Date.now()}_${randomUUID().slice(0, 8)}`;

  otps.set(requestId, {
    otpHash: hashOtpValue(otp),
    phoneHash,
    expiresAt: Date.now() + OTP_TTL_MS,
    attemptsRemaining: OTP_MAX_ATTEMPTS,
    consumed: false,
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV OTP] phone=${phone} otp=${otp} requestId=${requestId}`);
  }

  const masked = `${phone.slice(0, 2)}••••••${phone.slice(-2)}`;
  return {
    requestId,
    maskedPhone: masked,
    expiresInSeconds: OTP_TTL_MS / 1000,
    ...(process.env.NODE_ENV === "development" ? { _devOtp: otp } : {}),
  };
}

export type OtpResult =
  | { ok: true; phoneHash: string }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "CONSUMED" | "INVALID" | "RATE_LIMITED" };

export function verifyOtp(requestId: string, otp: string): OtpResult {
  const record = otps.get(requestId);
  if (!record) return { ok: false, reason: "NOT_FOUND" };
  if (record.consumed) return { ok: false, reason: "CONSUMED" };
  if (Date.now() > record.expiresAt) {
    otps.delete(requestId);
    return { ok: false, reason: "EXPIRED" };
  }
  if (record.attemptsRemaining <= 0) return { ok: false, reason: "RATE_LIMITED" };

  const valid = hashOtpValue(otp) === record.otpHash;
  if (!valid) {
    const remaining = record.attemptsRemaining - 1;
    otps.set(requestId, { ...record, attemptsRemaining: remaining });
    return remaining === 0
      ? { ok: false, reason: "RATE_LIMITED" }
      : { ok: false, reason: "INVALID" };
  }

  // Consume immediately — single use
  otps.set(requestId, { ...record, consumed: true });
  return { ok: true, phoneHash: record.phoneHash };
}

// ─── User operations ──────────────────────────────────────────────────────────

export function findUserByPhone(phoneHash: string): StoredUser | null {
  return usersByPhoneHash.get(phoneHash) ?? null;
}

export function findUserById(nexusId: string): StoredUser | null {
  return usersByNexusId.get(nexusId) ?? null;
}

export function createUser(phoneHash: string): StoredUser {
  const now = new Date();
  const user: StoredUser = {
    nexusId: `nexus_${randomUUID()}`,
    phoneHash,
    role: "PATIENT",
    trustLevel: 1,
    authMode: "MODE_B",
    abhaLinked: false,
    createdAt: now,
    updatedAt: now,
  };
  usersByNexusId.set(user.nexusId, user);
  usersByPhoneHash.set(phoneHash, user);
  return user;
}

export interface UpdateUserParams {
  displayName?: string | undefined;
  email?: string | undefined;
  abhaId?: string | undefined;
}

export function updateUser(nexusId: string, params: UpdateUserParams): StoredUser | null {
  const user = usersByNexusId.get(nexusId);
  if (!user) return null;

  const now = new Date();
  const updated: StoredUser = {
    ...user,
    ...(params.displayName !== undefined ? { displayName: params.displayName } : {}),
    ...(params.email !== undefined ? { email: params.email } : {}),
    ...(params.abhaId !== undefined ? { abhaId: params.abhaId } : {}),
    updatedAt: now,
  };

  usersByNexusId.set(nexusId, updated);
  usersByPhoneHash.set(user.phoneHash, updated);
  return updated;
}

// ─── Session operations ───────────────────────────────────────────────────────

const SESSION_TTL_S = 60 * 60 * 24 * 7; // 7 days

export function createSession(nexusId: string, trustLevel: 1 | 2 | 3 | 4 | 5, authMode: "MODE_A" | "MODE_B"): StoredSession {
  const now = Math.floor(Date.now() / 1000);
  const session: StoredSession = {
    sessionId: `sess_${randomUUID()}`,
    nexusId,
    trustLevel,
    authMode,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_S,
  };
  sessions.set(session.sessionId, session);
  return session;
}

export function findSession(sessionId: string): StoredSession | null {
  if (deniedSessions.has(sessionId)) return null;
  const s = sessions.get(sessionId);
  if (!s) return null;
  if (Math.floor(Date.now() / 1000) > s.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return s;
}

export function invalidateSession(sessionId: string): void {
  sessions.delete(sessionId);
  deniedSessions.add(sessionId);
}

// ─── Health Record operations ─────────────────────────────────────────────────

export interface CreateHealthRecordParams {
  nexusId: string;
  title: string;
  category: string;
  source: string;
  notes?: string | undefined;
  issuedDate?: Date | undefined;
  providerName?: string | undefined;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
}

export function createHealthRecord(params: CreateHealthRecordParams): StoredHealthRecord {
  const now = new Date();
  const id = `rec_${randomUUID()}`;
  const record: StoredHealthRecord = {
    id,
    nexusId: params.nexusId,
    title: params.title,
    category: params.category,
    source: params.source,
    verificationStatus: "PENDING",
    notes: params.notes,
    issuedDate: params.issuedDate,
    providerName: params.providerName,
    fileName: params.fileName,
    fileMimeType: params.fileMimeType,
    fileSizeBytes: params.fileSizeBytes,
    fileUrl: `/files/${id}/${encodeURIComponent(params.fileName)}`,
    createdAt: now,
    updatedAt: now,
  };

  healthRecords.set(id, record);

  // Update user index
  let userSet = healthRecordsByUser.get(params.nexusId);
  if (!userSet) {
    userSet = new Set<string>();
    healthRecordsByUser.set(params.nexusId, userSet);
  }
  userSet.add(id);

  return record;
}

export function findHealthRecordById(id: string): StoredHealthRecord | null {
  return healthRecords.get(id) ?? null;
}

export function findHealthRecordsByUser(nexusId: string): StoredHealthRecord[] {
  const ids = healthRecordsByUser.get(nexusId);
  if (!ids) return [];
  const results: StoredHealthRecord[] = [];
  for (const id of ids) {
    const record = healthRecords.get(id);
    // Exclude soft-deleted records from normal queries
    if (record && !record.deletedAt) results.push(record);
  }
  // Sort by createdAt descending (newest first)
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return results;
}

export function updateHealthRecord(
  id: string,
  nexusId: string,
  updates: Partial<Pick<StoredHealthRecord, "title" | "category" | "notes" | "issuedDate" | "providerName" | "verificationStatus">>
): StoredHealthRecord | null {
  const record = healthRecords.get(id);
  if (!record || record.nexusId !== nexusId || record.deletedAt) return null;

  const updated: StoredHealthRecord = {
    ...record,
    ...updates,
    updatedAt: new Date(),
  };
  healthRecords.set(id, updated);
  return updated;
}

/**
 * Soft-delete: marks the record with a deletedAt timestamp.
 * The record remains in the store but is excluded from normal queries.
 */
export function deleteHealthRecord(id: string, nexusId: string): boolean {
  const record = healthRecords.get(id);
  if (!record || record.nexusId !== nexusId) return false;
  if (record.deletedAt) return false; // Already deleted

  healthRecords.set(id, {
    ...record,
    deletedAt: new Date(),
    updatedAt: new Date(),
  });
  return true;
}

// ─── Medication operations ───────────────────────────────────────────────────

export interface CreateMedicationParams {
  nexusId: string;
  name: string;
  dosage: string;
  dosageUnit: string;
  frequency: string;
  route: string;
  instructions?: string | undefined;
  prescribedBy?: string | undefined;
  prescribedByNexusId?: string | null | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  refillsRemaining?: number | undefined;
  prescriptionRecordId?: string | undefined;
  status?: string | undefined;
}

export function createMedication(params: CreateMedicationParams): StoredMedication {
  const now = new Date();
  const id = `med_${randomUUID()}`;
  const record: StoredMedication = {
    id,
    nexusId: params.nexusId,
    name: params.name,
    dosage: params.dosage,
    dosageUnit: params.dosageUnit,
    frequency: params.frequency,
    route: params.route,
    instructions: params.instructions,
    prescribedBy: params.prescribedBy,
    prescribedByNexusId: params.prescribedByNexusId,
    startDate: params.startDate,
    endDate: params.endDate,
    refillsRemaining: params.refillsRemaining,
    prescriptionRecordId: params.prescriptionRecordId,
    status: params.status || "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  medications.set(id, record);

  // Update user index
  let userSet = medicationsByUser.get(params.nexusId);
  if (!userSet) {
    userSet = new Set<string>();
    medicationsByUser.set(params.nexusId, userSet);
  }
  userSet.add(id);

  return record;
}

export function findMedicationById(id: string): StoredMedication | null {
  return medications.get(id) ?? null;
}

export function findMedicationsByUser(nexusId: string): StoredMedication[] {
  const ids = medicationsByUser.get(nexusId);
  if (!ids) return [];
  const results: StoredMedication[] = [];
  for (const id of ids) {
    const record = medications.get(id);
    // Exclude soft-deleted medications from normal queries
    if (record && !record.deletedAt) results.push(record);
  }
  // Sort by createdAt descending (newest first)
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return results;
}

export function updateMedication(
  id: string,
  nexusId: string,
  updates: Partial<
    Pick<
      StoredMedication,
      | "name"
      | "dosage"
      | "dosageUnit"
      | "frequency"
      | "route"
      | "instructions"
      | "prescribedBy"
      | "startDate"
      | "endDate"
      | "refillsRemaining"
      | "prescriptionRecordId"
      | "status"
    >
  >
): StoredMedication | null {
  const record = medications.get(id);
  if (!record || record.nexusId !== nexusId || record.deletedAt) return null;

  const updated: StoredMedication = {
    ...record,
    ...updates,
    updatedAt: new Date(),
  };
  medications.set(id, updated);
  return updated;
}

/**
 * Soft-delete: marks the medication with a deletedAt timestamp.
 * The record remains in the store but is excluded from normal queries.
 */
export function deleteMedication(id: string, nexusId: string): boolean {
  const record = medications.get(id);
  if (!record || record.nexusId !== nexusId) return false;
  if (record.deletedAt) return false; // Already deleted

  medications.set(id, {
    ...record,
    deletedAt: new Date(),
    updatedAt: new Date(),
  });
  return true;
}

// ─── Lab Result operations ───────────────────────────────────────────────────

export interface CreateLabResultParams {
  nexusId: string;
  testName: string;
  category: string;
  value: string;
  numericValue?: number | undefined;
  unit?: string | undefined;
  referenceRangeMin?: number | undefined;
  referenceRangeMax?: number | undefined;
  referenceRangeText?: string | undefined;
  status: string;
  labName?: string | undefined;
  collectedAt?: Date | undefined;
  resultDate?: Date | undefined;
  notes?: string | undefined;
  healthRecordId?: string | undefined;
}

export function createLabResult(params: CreateLabResultParams): StoredLabResult {
  const now = new Date();
  const id = `lab_${randomUUID()}`;
  const record: StoredLabResult = {
    id,
    nexusId: params.nexusId,
    testName: params.testName,
    category: params.category,
    value: params.value,
    numericValue: params.numericValue,
    unit: params.unit,
    referenceRangeMin: params.referenceRangeMin,
    referenceRangeMax: params.referenceRangeMax,
    referenceRangeText: params.referenceRangeText,
    status: params.status || "NORMAL",
    labName: params.labName,
    collectedAt: params.collectedAt,
    resultDate: params.resultDate,
    notes: params.notes,
    healthRecordId: params.healthRecordId,
    createdAt: now,
    updatedAt: now,
  };

  labResults.set(id, record);

  // Update user index
  let userSet = labResultsByUser.get(params.nexusId);
  if (!userSet) {
    userSet = new Set<string>();
    labResultsByUser.set(params.nexusId, userSet);
  }
  userSet.add(id);

  return record;
}

export function findLabResultById(id: string): StoredLabResult | null {
  return labResults.get(id) ?? null;
}

export function findLabResultsByUser(nexusId: string): StoredLabResult[] {
  const ids = labResultsByUser.get(nexusId);
  if (!ids) return [];
  const results: StoredLabResult[] = [];
  for (const id of ids) {
    const record = labResults.get(id);
    // Exclude soft-deleted lab results from normal queries
    if (record && !record.deletedAt) results.push(record);
  }
  // Sort by resultDate/createdAt descending (newest first)
  results.sort((a, b) => {
    const timeA = (a.resultDate || a.createdAt).getTime();
    const timeB = (b.resultDate || b.createdAt).getTime();
    return timeB - timeA;
  });
  return results;
}

export function updateLabResult(
  id: string,
  nexusId: string,
  updates: Partial<
    Pick<
      StoredLabResult,
      | "testName"
      | "category"
      | "value"
      | "numericValue"
      | "unit"
      | "referenceRangeMin"
      | "referenceRangeMax"
      | "referenceRangeText"
      | "status"
      | "labName"
      | "collectedAt"
      | "resultDate"
      | "notes"
      | "healthRecordId"
    >
  >
): StoredLabResult | null {
  const record = labResults.get(id);
  if (!record || record.nexusId !== nexusId || record.deletedAt) return null;

  const updated: StoredLabResult = {
    ...record,
    ...updates,
    updatedAt: new Date(),
  };
  labResults.set(id, updated);
  return updated;
}

/**
 * Soft-delete: marks the lab result with a deletedAt timestamp.
 * The record remains in the store but is excluded from normal queries.
 */
export function deleteLabResult(id: string, nexusId: string): boolean {
  const record = labResults.get(id);
  if (!record || record.nexusId !== nexusId) return false;
  if (record.deletedAt) return false; // Already deleted

  labResults.set(id, {
    ...record,
    deletedAt: new Date(),
    updatedAt: new Date(),
  });
  return true;
}

// ─── Insurance operations ─────────────────────────────────────────────────────

export interface CreateInsuranceParams {
  nexusId: string;
  policyNumber: string;
  providerName: string;
  policyName: string;
  policyType: string;
  sumInsured: number;
  premiumAmount?: number | undefined;
  startDate?: Date | undefined;
  expiryDate: Date;
  status: string;
  tpaName?: string | undefined;
  tpaContact?: string | undefined;
  networkHospitalUrl?: string | undefined;
  policyDocumentRecordId?: string | undefined;
  notes?: string | undefined;
}

export function createInsurancePolicy(
  params: CreateInsuranceParams
): StoredInsurancePolicy {
  const now = new Date();
  const id = `ins_${randomUUID()}`;
  const record: StoredInsurancePolicy = {
    id,
    nexusId: params.nexusId,
    policyNumber: params.policyNumber,
    providerName: params.providerName,
    policyName: params.policyName,
    policyType: params.policyType,
    sumInsured: params.sumInsured,
    premiumAmount: params.premiumAmount,
    startDate: params.startDate,
    expiryDate: params.expiryDate,
    status: params.status || "ACTIVE",
    tpaName: params.tpaName,
    tpaContact: params.tpaContact,
    networkHospitalUrl: params.networkHospitalUrl,
    policyDocumentRecordId: params.policyDocumentRecordId,
    notes: params.notes,
    createdAt: now,
    updatedAt: now,
  };

  insurancePolicies.set(id, record);

  // Update user index
  let userSet = insurancePoliciesByUser.get(params.nexusId);
  if (!userSet) {
    userSet = new Set<string>();
    insurancePoliciesByUser.set(params.nexusId, userSet);
  }
  userSet.add(id);

  return record;
}

export function findInsurancePolicyById(id: string): StoredInsurancePolicy | null {
  return insurancePolicies.get(id) ?? null;
}

export function findInsurancePoliciesByUser(
  nexusId: string
): StoredInsurancePolicy[] {
  const ids = insurancePoliciesByUser.get(nexusId);
  if (!ids) return [];
  const results: StoredInsurancePolicy[] = [];
  for (const id of ids) {
    const record = insurancePolicies.get(id);
    // Exclude soft-deleted policies from normal queries
    if (record && !record.deletedAt) results.push(record);
  }
  // Sort by expiryDate ascending (closest renewal first), fallback to createdAt desc
  results.sort((a, b) => {
    const timeA = a.expiryDate.getTime();
    const timeB = b.expiryDate.getTime();
    return timeA - timeB;
  });
  return results;
}

export function updateInsurancePolicy(
  id: string,
  nexusId: string,
  updates: Partial<
    Pick<
      StoredInsurancePolicy,
      | "policyNumber"
      | "providerName"
      | "policyName"
      | "policyType"
      | "sumInsured"
      | "premiumAmount"
      | "startDate"
      | "expiryDate"
      | "status"
      | "tpaName"
      | "tpaContact"
      | "networkHospitalUrl"
      | "policyDocumentRecordId"
      | "notes"
    >
  >
): StoredInsurancePolicy | null {
  const record = insurancePolicies.get(id);
  if (!record || record.nexusId !== nexusId || record.deletedAt) return null;

  const updated: StoredInsurancePolicy = {
    ...record,
    ...updates,
    updatedAt: new Date(),
  };
  insurancePolicies.set(id, updated);
  return updated;
}

/**
 * Soft-delete: marks the insurance policy with a deletedAt timestamp.
 * The record remains in the store but is excluded from normal queries.
 */
export function deleteInsurancePolicy(id: string, nexusId: string): boolean {
  const record = insurancePolicies.get(id);
  if (!record || record.nexusId !== nexusId) return false;
  if (record.deletedAt) return false; // Already deleted

  insurancePolicies.set(id, {
    ...record,
    deletedAt: new Date(),
    updatedAt: new Date(),
  });
  return true;
}

// ─── Consent & Privacy operations ─────────────────────────────────────────────

export interface CreateConsentParams {
  nexusId: string;
  recipientNexusId?: string | undefined;
  recipientName: string;
  recipientType: string;
  organizationName?: string | undefined;
  purpose: string;
  dataScopes: string[];
  permission: string;
  status?: string | undefined; // Defaults to ACTIVE unless PENDING_APPROVAL
  grantedAt?: Date | undefined;
  expiresAt: Date;
  notes?: string | undefined;
}

export function createConsent(params: CreateConsentParams): StoredConsent {
  const now = new Date();
  const id = `cns_${randomUUID()}`;
  const status = params.status || "ACTIVE";
  const grantedAt = status === "ACTIVE" ? params.grantedAt || now : undefined;

  const record: StoredConsent = {
    id,
    nexusId: params.nexusId,
    recipientNexusId: params.recipientNexusId,
    recipientName: params.recipientName,
    recipientType: params.recipientType,
    organizationName: params.organizationName,
    purpose: params.purpose,
    dataScopes: params.dataScopes,
    permission: params.permission,
    status,
    grantedAt,
    expiresAt: params.expiresAt,
    notes: params.notes,
    createdAt: now,
    updatedAt: now,
  };

  consents.set(id, record);

  // Update user index (patient owner)
  let userSet = consentsByUser.get(params.nexusId);
  if (!userSet) {
    userSet = new Set<string>();
    consentsByUser.set(params.nexusId, userSet);
  }
  userSet.add(id);

  // Update recipient index (if doctor or registered recipient)
  if (params.recipientNexusId) {
    let recipientSet = consentsByRecipient.get(params.recipientNexusId);
    if (!recipientSet) {
      recipientSet = new Set<string>();
      consentsByRecipient.set(params.recipientNexusId, recipientSet);
    }
    recipientSet.add(id);
  }

  return record;
}

export function findConsentById(id: string): StoredConsent | null {
  return consents.get(id) ?? null;
}

export function findConsentsByUser(nexusId: string): StoredConsent[] {
  const ids = consentsByUser.get(nexusId);
  if (!ids) return [];
  const now = new Date();
  const results: StoredConsent[] = [];

  for (const id of ids) {
    const record = consents.get(id);
    if (!record || record.deletedAt) continue;

    // Check if an ACTIVE consent has expired
    if (record.status === "ACTIVE" && record.expiresAt.getTime() < now.getTime()) {
      record.status = "EXPIRED";
      record.updatedAt = now;
      consents.set(id, record);
    }

    results.push(record);
  }

  // Sort by createdAt desc
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return results;
}

export function findConsentsByRecipient(recipientNexusId: string): StoredConsent[] {
  const ids = consentsByRecipient.get(recipientNexusId);
  if (!ids) return [];
  const now = new Date();
  const results: StoredConsent[] = [];

  for (const id of ids) {
    const record = consents.get(id);
    if (!record || record.deletedAt) continue;

    // Check if an ACTIVE consent has expired
    if (record.status === "ACTIVE" && record.expiresAt.getTime() < now.getTime()) {
      record.status = "EXPIRED";
      record.updatedAt = now;
      consents.set(id, record);
    }

    results.push(record);
  }

  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return results;
}

export function findConsentsByDoctorAndPatient(
  doctorNexusId: string,
  patientNexusId: string
): StoredConsent[] {
  const patientConsents = findConsentsByUser(patientNexusId);
  return patientConsents.filter(
    (c) => c.recipientNexusId === doctorNexusId && !c.deletedAt
  );
}

export function findActiveConsent(
  doctorNexusId: string,
  patientNexusId: string
): StoredConsent | null {
  const now = new Date();
  const consentsList = findConsentsByDoctorAndPatient(doctorNexusId, patientNexusId);
  return (
    consentsList.find(
      (c) => c.status === "ACTIVE" && c.expiresAt.getTime() >= now.getTime()
    ) ?? null
  );
}

export function updateConsent(
  id: string,
  nexusId: string,
  updates: Partial<
    Pick<
      StoredConsent,
      | "recipientNexusId"
      | "recipientName"
      | "recipientType"
      | "organizationName"
      | "purpose"
      | "dataScopes"
      | "permission"
      | "status"
      | "expiresAt"
      | "notes"
    >
  >
): StoredConsent | null {
  const record = consents.get(id);
  if (!record || record.nexusId !== nexusId || record.deletedAt) return null;

  const now = new Date();
  const updated: StoredConsent = {
    ...record,
    ...updates,
    updatedAt: now,
  };
  consents.set(id, updated);
  return updated;
}

export function approveConsent(id: string, nexusId: string): StoredConsent | null {
  const record = consents.get(id);
  if (!record || record.nexusId !== nexusId || record.deletedAt) return null;

  const now = new Date();
  const updated: StoredConsent = {
    ...record,
    status: "ACTIVE",
    grantedAt: now,
    updatedAt: now,
  };
  consents.set(id, updated);
  return updated;
}

export function rejectConsent(id: string, nexusId: string): StoredConsent | null {
  const record = consents.get(id);
  if (!record || record.nexusId !== nexusId || record.deletedAt) return null;

  const now = new Date();
  const updated: StoredConsent = {
    ...record,
    status: "REJECTED",
    updatedAt: now,
  };
  consents.set(id, updated);
  return updated;
}

export function revokeConsent(id: string, nexusId: string): StoredConsent | null {
  const record = consents.get(id);
  if (!record || record.nexusId !== nexusId || record.deletedAt) return null;

  const now = new Date();
  const updated: StoredConsent = {
    ...record,
    status: "REVOKED",
    revokedAt: now,
    updatedAt: now,
  };
  consents.set(id, updated);
  return updated;
}

/**
 * Soft-delete: marks the consent record with a deletedAt timestamp.
 * The record remains in the store but is excluded from normal queries.
 */
export function deleteConsent(id: string, nexusId: string): boolean {
  const record = consents.get(id);
  if (!record || record.nexusId !== nexusId) return false;
  if (record.deletedAt) return false; // Already deleted

  consents.set(id, {
    ...record,
    deletedAt: new Date(),
    updatedAt: new Date(),
  });
  return true;
}

// ─── Activity store operations ────────────────────────────────────────────────

export interface CreateActivityParams {
  nexusId: string;
  type: string;
  title: string;
  description: string;
  entityType?: string | undefined;
  entityId?: string | undefined;
  timestamp?: Date | undefined;
}

/**
 * Creates and stores a new immutable activity event.
 */
export function createActivity(params: CreateActivityParams): StoredActivity {
  const id = `act_${crypto.randomUUID()}`;
  const now = new Date();
  const activity: StoredActivity = {
    id,
    nexusId: params.nexusId,
    type: params.type,
    title: params.title,
    description: params.description,
    isRead: false,
    entityType: params.entityType,
    entityId: params.entityId,
    timestamp: params.timestamp ?? now,
    createdAt: now,
  };

  activities.set(id, activity);

  let userActivityIds = activitiesByUser.get(params.nexusId);
  if (!userActivityIds) {
    userActivityIds = new Set<string>();
    activitiesByUser.set(params.nexusId, userActivityIds);
  }
  userActivityIds.add(id);

  return activity;
}

export function findActivityById(id: string): StoredActivity | null {
  return activities.get(id) ?? null;
}

/**
 * Returns all activities for a user, sorted newest first by timestamp.
 */
export function findActivitiesByUser(nexusId: string): StoredActivity[] {
  const ids = activitiesByUser.get(nexusId);
  if (!ids || ids.size === 0) return [];

  const userActivities: StoredActivity[] = [];
  for (const id of ids) {
    const act = activities.get(id);
    if (act) {
      userActivities.push(act);
    }
  }

  // Sort descending by timestamp
  return userActivities.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}

/**
 * Marks an activity as read. Content remains immutable.
 */
export function markActivityAsRead(
  id: string,
  nexusId: string
): StoredActivity | null {
  const record = activities.get(id);
  if (!record || record.nexusId !== nexusId) return null;

  if (record.isRead) return record;

  const updated: StoredActivity = {
    ...record,
    isRead: true,
  };
  activities.set(id, updated);
  return updated;
}

/**
 * Marks all activities for a user as read.
 * Returns the count of newly marked items.
 */
export function markAllActivitiesAsRead(nexusId: string): number {
  const ids = activitiesByUser.get(nexusId);
  if (!ids || ids.size === 0) return 0;

  let markedCount = 0;
  for (const id of ids) {
    const act = activities.get(id);
    if (act && !act.isRead) {
      activities.set(id, { ...act, isRead: true });
      markedCount++;
    }
  }

  return markedCount;
}

// ─── Doctor User operations ───────────────────────────────────────────────────

export function createDoctorUser(phoneHash: string, displayName: string): StoredUser {
  const now = new Date();
  const user: StoredUser = {
    nexusId: `nexus_${randomUUID()}`,
    phoneHash,
    role: "DOCTOR",
    trustLevel: 1,
    authMode: "MODE_B",
    abhaLinked: false,
    displayName,
    createdAt: now,
    updatedAt: now,
  };
  usersByNexusId.set(user.nexusId, user);
  usersByPhoneHash.set(phoneHash, user);
  return user;
}

// ─── Doctor Profile operations ────────────────────────────────────────────────

export interface CreateDoctorProfileParams {
  nexusId: string;
  specialization?: string | undefined;
  qualifications?: string | undefined;
  clinicName?: string | undefined;
  registrationNumber?: string | undefined;
  consultationAddress?: string | undefined;
  consultationPhone?: string | undefined;
}

export function createDoctorProfile(params: CreateDoctorProfileParams): StoredDoctorProfile {
  const now = new Date();
  const hasRequired = Boolean(params.specialization && params.clinicName);
  // Also check that the linked user has a displayName
  const user = usersByNexusId.get(params.nexusId);
  const hasDisplayName = Boolean(user?.displayName);

  const profile: StoredDoctorProfile = {
    nexusId: params.nexusId,
    specialization: params.specialization,
    qualifications: params.qualifications,
    clinicName: params.clinicName,
    registrationNumber: params.registrationNumber,
    consultationAddress: params.consultationAddress,
    consultationPhone: params.consultationPhone,
    profileStatus: hasRequired && hasDisplayName ? "ACTIVE" : "INCOMPLETE",
    createdAt: now,
    updatedAt: now,
  };

  doctorProfiles.set(params.nexusId, profile);
  return profile;
}

export function findDoctorProfile(nexusId: string): StoredDoctorProfile | null {
  return doctorProfiles.get(nexusId) ?? null;
}

export interface UpdateDoctorProfileParams {
  specialization?: string | undefined;
  qualifications?: string | undefined;
  clinicName?: string | undefined;
  registrationNumber?: string | undefined;
  consultationAddress?: string | undefined;
  consultationPhone?: string | undefined;
}

export function updateDoctorProfile(
  nexusId: string,
  params: UpdateDoctorProfileParams
): StoredDoctorProfile | null {
  const profile = doctorProfiles.get(nexusId);
  if (!profile) return null;

  const now = new Date();
  const updated: StoredDoctorProfile = {
    ...profile,
    ...(params.specialization !== undefined ? { specialization: params.specialization } : {}),
    ...(params.qualifications !== undefined ? { qualifications: params.qualifications } : {}),
    ...(params.clinicName !== undefined ? { clinicName: params.clinicName } : {}),
    ...(params.registrationNumber !== undefined ? { registrationNumber: params.registrationNumber } : {}),
    ...(params.consultationAddress !== undefined ? { consultationAddress: params.consultationAddress } : {}),
    ...(params.consultationPhone !== undefined ? { consultationPhone: params.consultationPhone } : {}),
    updatedAt: now,
  };

  // Recompute profileStatus
  const user = usersByNexusId.get(nexusId);
  const hasDisplayName = Boolean(user?.displayName);
  const hasRequired = Boolean(updated.specialization && updated.clinicName);
  updated.profileStatus = hasRequired && hasDisplayName ? "ACTIVE" : "INCOMPLETE";

  doctorProfiles.set(nexusId, updated);
  return updated;
}
