/**
 * Dashboard Types
 *
 * Defines the canonical data shapes consumed by the dashboard layer.
 * Business modules (Health Records, OCR, Insurance, etc.) will implement
 * the service interfaces declared here as they are built.
 */

// ─── Health overview ──────────────────────────────────────────────────────────

export interface HealthScoreSummary {
  score: number | null;          // 0–100; null if insufficient data
  trend: "up" | "down" | "stable" | "unknown";
  trendDelta: number | null;     // points changed since last period
  lastCalculatedAt: Date | null;
  label: string;                 // Human-readable interpretation e.g. "Good"
}

export interface MedicalRecordsSummary {
  totalRecords: number;
  recentCount: number;           // Records added in last 30 days
  pendingVerification: number;   // Low-confidence records awaiting review
  lastUpdatedAt: Date | null;
  sourceBreakdown: {
    uploaded: number;
    fetched: number;             // Via ABDM
    contributed: number;         // Via hospital/lab adapters
  };
}

export interface InsuranceSummary {
  activePolicies: number;
  totalCoverage: number | null;  // INR; null if not parsed
  nearestRenewalDays: number | null;
  lastUpdatedAt: Date | null;
}

export interface ConsentSummary {
  activeConsents: number;
  pendingRequests: number;
  lastActivityAt: Date | null;
}

export interface LabSummary {
  totalResults: number;
  flaggedResults: number;        // Outside reference range
  recentCount: number;           // Results in last 30 days
  lastResultAt: Date | null;
}

export interface MedicationSummary {
  activeMedications: number;
  adherenceRate: number | null;  // 0–100; null if insufficient data
  pendingRefills: number;
  lastUpdatedAt: Date | null;
}

// ─── Activity feed ────────────────────────────────────────────────────────────

export const ActivityType = {
  RECORD_ADDED: "RECORD_ADDED",
  RECORD_VERIFIED: "RECORD_VERIFIED",
  CONSENT_REQUESTED: "CONSENT_REQUESTED",
  CONSENT_GRANTED: "CONSENT_GRANTED",
  CONSENT_REJECTED: "CONSENT_REJECTED",
  CONSENT_REVOKED: "CONSENT_REVOKED",
  PATIENT_DATA_ACCESSED: "PATIENT_DATA_ACCESSED",
  LAB_RESULT_RECEIVED: "LAB_RESULT_RECEIVED",
  MEDICATION_DISPENSED: "MEDICATION_DISPENSED",
  PRESCRIPTION_CREATED: "PRESCRIPTION_CREATED",
  INSURANCE_UPDATED: "INSURANCE_UPDATED",
  LOGIN: "LOGIN",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  isRead: boolean;
  metadata?: Record<string, string | number | boolean>;
}

// ─── Upcoming tasks ───────────────────────────────────────────────────────────

export const TaskPriority = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export interface DashboardTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: Date;
  actionLabel?: string;
  actionHref?: string;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface PatientProfileSummary {
  nexusId: string;
  preferredName?: string;
  completionScore: number;        // 0–100
  abhaLinked: boolean;
  lastLoginAt: Date | null;
  memberSince: Date;
}

// ─── Full dashboard data ──────────────────────────────────────────────────────

export interface DashboardData {
  profile: PatientProfileSummary;
  healthScore: HealthScoreSummary;
  medicalRecords: MedicalRecordsSummary;
  insurance: InsuranceSummary;
  consent: ConsentSummary;
  labs: LabSummary;
  medications: MedicationSummary;
  recentActivity: ActivityItem[];
  upcomingTasks: DashboardTask[];
  fetchedAt: Date;
}

// ─── Widget state ─────────────────────────────────────────────────────────────

export type WidgetStatus = "loading" | "success" | "error" | "empty";

export interface WidgetState<T> {
  status: WidgetStatus;
  data: T | null;
  error?: string;
}
