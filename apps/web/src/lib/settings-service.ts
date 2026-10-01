/**
 * Settings Service
 *
 * Business logic layer for User Settings & Account Management.
 * Sits between API routes and the singleton store.
 */

import {
  findUserById,
  updateUser as storeUpdateUser,
  findSession,
  type StoredUser,
  type StoredSession,
} from "@/lib/store.ts";
import type { UserSettings, UpdateSettingsInput } from "@/types/settings.ts";

function toUserSettings(user: StoredUser, session?: StoredSession | null): UserSettings {
  return {
    nexusId: user.nexusId,
    displayName: user.displayName,
    email: user.email,
    abhaId: user.abhaId,
    abhaLinked: user.abhaLinked,
    role: user.role,
    trustLevel: user.trustLevel,
    authMode: user.authMode,
    sessionIssuedAt: session ? new Date(session.issuedAt * 1000) : undefined,
    sessionExpiresAt: session ? new Date(session.expiresAt * 1000) : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getUserSettings(
  nexusId: string,
  sessionId?: string
): Promise<UserSettings | null> {
  const user = findUserById(nexusId);
  if (!user) return null;

  const session = sessionId ? findSession(sessionId) : null;
  return toUserSettings(user, session);
}

export async function updateUserSettings(
  nexusId: string,
  input: UpdateSettingsInput,
  sessionId?: string
): Promise<UserSettings | null> {
  const updated = storeUpdateUser(nexusId, {
    displayName: input.displayName?.trim() || undefined,
    email: input.email?.trim() || undefined,
    abhaId: input.abhaId?.trim() || undefined,
  });

  if (!updated) return null;

  const session = sessionId ? findSession(sessionId) : null;
  return toUserSettings(updated, session);
}
