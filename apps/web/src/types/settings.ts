/**
 * Settings & Account Management Domain Types (Phase 10)
 *
 * Safe user-facing settings and profile representations.
 * Explicitly avoids leaking sensitive auth secrets or fake preferences.
 */

export interface UserSettings {
  nexusId: string;
  displayName?: string | undefined;
  email?: string | undefined;
  abhaId?: string | undefined;
  abhaLinked: boolean;
  role: "PATIENT" | "CAREGIVER" | "ADMIN" | "DOCTOR";
  trustLevel: 1 | 2 | 3 | 4 | 5;
  authMode: "MODE_A" | "MODE_B";
  sessionIssuedAt?: Date | undefined;
  sessionExpiresAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSettingsInput {
  displayName?: string | undefined;
  email?: string | undefined;
  abhaId?: string | undefined;
}

export interface SettingsResponse {
  settings: UserSettings;
}
