/**
 * Dashboard Service
 *
 * Aggregates data from all feature modules into a single DashboardData shape.
 * Each sub-service method is independently replaceable when the real module
 * is implemented — callers always go through this service, never directly
 * to module-internal APIs.
 */

import { getMedicalRecordsSummary } from "@/lib/health-records-service.ts";
import { getMedicationsSummary } from "@/lib/medications-service.ts";
import { getLabsSummary } from "@/lib/labs-service.ts";
import { getInsuranceSummary } from "@/lib/insurance-service.ts";
import { getConsentSummary } from "@/lib/consent-service.ts";
import { getRecentActivities } from "@/lib/activity-service.ts";
import type {
  DashboardData,
  PatientProfileSummary,
  HealthScoreSummary,
  DashboardTask,
} from "@/types/dashboard.ts";
import { TaskPriority } from "@/types/dashboard.ts";

// ─── Mock data generators ─────────────────────────────────────────────────────
// Replace each function body with a real service call when the module is ready.

function mockProfile(nexusId: string): PatientProfileSummary {
  return {
    nexusId,
    completionScore: 30,
    abhaLinked: false,
    lastLoginAt: new Date(),
    memberSince: new Date(),
  };
}

function mockHealthScore(): HealthScoreSummary {
  return {
    score: null,
    trend: "unknown",
    trendDelta: null,
    lastCalculatedAt: null,
    label: "Not enough data",
  };
}

// mockMedicalRecords — replaced by getMedicalRecordsSummary() from health-records-service.ts

// mockInsurance — replaced by getInsuranceSummary() from insurance-service.ts

// mockConsent — replaced by getConsentSummary() from consent-service.ts

// mockLabs — replaced by getLabsSummary() from labs-service.ts

// mockMedications — replaced by getMedicationsSummary() from medications-service.ts

// mockActivity — replaced by getRecentActivities() from activity-service.ts

function mockTasks(abhaLinked: boolean): DashboardTask[] {
  const tasks: DashboardTask[] = [];

  if (!abhaLinked) {
    tasks.push({
      id: "task_link_abha",
      title: "Link your ABHA ID",
      description: "Connect your Ayushman Bharat Health Account to fetch medical history.",
      priority: TaskPriority.HIGH,
      actionLabel: "Link ABHA",
      actionHref: "/settings/identity",
    });
  }

  tasks.push({
    id: "task_complete_profile",
    title: "Complete your profile",
    description: "Add your date of birth and preferred language.",
    priority: TaskPriority.MEDIUM,
    actionLabel: "Update profile",
    actionHref: "/settings/profile",
  });

  tasks.push({
    id: "task_upload_record",
    title: "Upload your first health record",
    description: "Upload a prescription, lab report, or insurance policy.",
    priority: TaskPriority.MEDIUM,
    actionLabel: "Upload record",
    actionHref: "/records/upload",
  });

  return tasks;
}

// ─── Public service API ───────────────────────────────────────────────────────

export async function fetchDashboardData(nexusId: string): Promise<DashboardData> {
  // In production: these become parallel async calls to each module's service.
  // For now: return mock data so the dashboard shell renders meaningfully.
  const profile = mockProfile(nexusId);

  const [healthScore, medicalRecords, insurance, consent, labs, medications, recentActivity] =
    await Promise.all([
      Promise.resolve(mockHealthScore()),
      Promise.resolve(getMedicalRecordsSummary(nexusId)),
      Promise.resolve(getInsuranceSummary(nexusId)),
      Promise.resolve(getConsentSummary(nexusId)),
      Promise.resolve(getLabsSummary(nexusId)),
      Promise.resolve(getMedicationsSummary(nexusId)),
      Promise.resolve(getRecentActivities(nexusId, 5)),
    ]);

  return {
    profile,
    healthScore,
    medicalRecords,
    insurance,
    consent,
    labs,
    medications,
    recentActivity,
    upcomingTasks: mockTasks(profile.abhaLinked),
    fetchedAt: new Date(),
  };
}
