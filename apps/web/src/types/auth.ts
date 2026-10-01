/**
 * Auth domain types.
 * StoredUser and StoredSession are the canonical types — imported from store.ts
 * which is the single in-process data layer.
 */
export type { StoredUser as NexusUser, StoredSession as AuthSession } from "@/lib/store.ts";

export const TrustLevel = {
  PHONE_VERIFIED: 1,
  EMAIL_VERIFIED: 2,
  ABHA_MEDIUM: 3,
  ABHA_HIGH: 4,
  STAFF_ELEVATED: 5,
} as const;
export type TrustLevel = (typeof TrustLevel)[keyof typeof TrustLevel];

export const AuthMode = {
  MODE_A: "MODE_A",
  MODE_B: "MODE_B",
} as const;
export type AuthMode = (typeof AuthMode)[keyof typeof AuthMode];

export const UserRole = {
  PATIENT: "PATIENT",
  CAREGIVER: "CAREGIVER",
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
