/**
 * Activity Log Domain Types
 *
 * Canonical types for the Activity Log & Audit module (Phase 9).
 * Consumed by the store, service layer, API routes, client hooks, and UI components.
 */

import { ActivityType, type ActivityItem } from "@/types/dashboard.ts";

export { ActivityType, type ActivityItem };

// ─── Entity Model ─────────────────────────────────────────────────────────────

export interface ActivityRecord {
  id: string;
  nexusId: string; // User owner foreign key
  type: ActivityType;
  title: string;
  description: string;
  isRead: boolean;
  entityType?:
    | "health_record"
    | "medication"
    | "lab_result"
    | "insurance_policy"
    | "consent"
    | "session"
    | undefined;
  entityId?: string | undefined;
  timestamp: Date;
  createdAt: Date;
}

// ─── Create Activity Input ────────────────────────────────────────────────────

export interface CreateActivityInput {
  type: ActivityType;
  title: string;
  description: string;
  entityType?:
    | "health_record"
    | "medication"
    | "lab_result"
    | "insurance_policy"
    | "consent"
    | "session"
    | undefined;
  entityId?: string | undefined;
  timestamp?: Date | undefined;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface ActivityFilters {
  search?: string | undefined;
  type?: ActivityType | undefined;
  unreadOnly?: boolean | undefined;
}

// ─── List Response ────────────────────────────────────────────────────────────

export interface ActivityListResponse {
  activities: ActivityItem[];
  total: number;
  unreadCount: number;
  filters: ActivityFilters;
}
