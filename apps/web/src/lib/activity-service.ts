/**
 * Activity Log Service
 *
 * Centralized business logic for activity event recording, listing, filtering,
 * and read-status tracking.
 *
 * All domain mutations across Health Records, Medications, Labs, Insurance,
 * Consent, and Authentication invoke `recordActivity()` upon successful persistence.
 */

import {
  createActivity as storeCreateActivity,
  findActivityById as storeFindActivityById,
  findActivitiesByUser as storeFindActivitiesByUser,
  markActivityAsRead as storeMarkActivityAsRead,
  markAllActivitiesAsRead as storeMarkAllActivitiesAsRead,
  type StoredActivity,
} from "@/lib/store.ts";
import {
  type ActivityRecord,
  type CreateActivityInput,
  type ActivityFilters,
  type ActivityListResponse,
  type ActivityItem,
  type ActivityType,
} from "@/types/activity.ts";

// ─── Converters ───────────────────────────────────────────────────────────────

function toActivityItem(stored: StoredActivity): ActivityItem {
  return {
    id: stored.id,
    type: stored.type as ActivityType,
    title: stored.title,
    description: stored.description,
    timestamp: stored.timestamp,
    isRead: stored.isRead,
  };
}

function toActivityRecord(stored: StoredActivity): ActivityRecord {
  return {
    id: stored.id,
    nexusId: stored.nexusId,
    type: stored.type as ActivityType,
    title: stored.title,
    description: stored.description,
    isRead: stored.isRead,
    entityType: stored.entityType as ActivityRecord["entityType"],
    entityId: stored.entityId,
    timestamp: stored.timestamp,
    createdAt: stored.createdAt,
  };
}

// ─── Public Service Methods ───────────────────────────────────────────────────

/**
 * Records a new immutable activity event for a user.
 */
export async function recordActivity(
  nexusId: string,
  input: CreateActivityInput
): Promise<ActivityRecord> {
  const stored = storeCreateActivity({
    nexusId,
    type: input.type,
    title: input.title,
    description: input.description,
    entityType: input.entityType,
    entityId: input.entityId,
    timestamp: input.timestamp,
  });

  return toActivityRecord(stored);
}

/**
 * Fetches single activity record by ID, isolated to the authenticated owner.
 */
export async function getActivity(
  id: string,
  nexusId: string
): Promise<ActivityRecord | null> {
  const stored = storeFindActivityById(id);
  if (!stored || stored.nexusId !== nexusId) return null;
  return toActivityRecord(stored);
}

/**
 * Lists user activities with search, type, and unread filtering.
 * Sorted chronologically descending (newest first).
 */
export async function listActivities(
  nexusId: string,
  filters: ActivityFilters = {}
): Promise<ActivityListResponse> {
  const storedList = storeFindActivitiesByUser(nexusId);

  // Total unread count across all user activities
  const unreadCount = storedList.filter((a) => !a.isRead).length;

  let filtered = storedList;

  // Filter by ActivityType
  if (filters.type) {
    filtered = filtered.filter((a) => a.type === filters.type);
  }

  // Filter by unread status
  if (filters.unreadOnly) {
    filtered = filtered.filter((a) => !a.isRead);
  }

  // Filter by search string
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }

  return {
    activities: filtered.map(toActivityItem),
    total: filtered.length,
    unreadCount,
    filters,
  };
}

/**
 * Returns recent activities for dashboard summary widget (default 5 items).
 */
export async function getRecentActivities(
  nexusId: string,
  limit = 5
): Promise<ActivityItem[]> {
  const storedList = storeFindActivitiesByUser(nexusId);
  return storedList.slice(0, limit).map(toActivityItem);
}

/**
 * Marks a single activity as read.
 */
export async function markActivityRead(
  id: string,
  nexusId: string
): Promise<boolean> {
  const updated = storeMarkActivityAsRead(id, nexusId);
  return updated !== null;
}

/**
 * Marks all activities for the user as read.
 */
export async function markAllActivitiesRead(nexusId: string): Promise<number> {
  return storeMarkAllActivitiesAsRead(nexusId);
}
