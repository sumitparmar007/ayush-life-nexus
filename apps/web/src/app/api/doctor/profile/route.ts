/**
 * Doctor Profile API
 *
 * GET   /api/doctor/profile — fetch own doctor profile
 * PATCH /api/doctor/profile — update own doctor profile
 *
 * Identity is ALWAYS derived from the authenticated session.
 * A doctor can never read or modify another doctor's profile via this endpoint.
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { verifySessionJwt, SESSION_COOKIE } from "@/lib/session.ts";
import {
  findSession,
  findUserById,
  findDoctorProfile,
  updateDoctorProfile,
  updateUser,
} from "@/lib/store.ts";
import { ok, err, fromError } from "@/lib/api-response.ts";

// ─── Doctor auth helper ───────────────────────────────────────────────────────

async function authenticateDoctorRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return { error: err("UNAUTHORIZED", "No session", 401) };

  const sessionId = await verifySessionJwt(token);
  if (!sessionId)
    return { error: err("INVALID_TOKEN", "Invalid token", 401) };

  const session = findSession(sessionId);
  if (!session)
    return { error: err("SESSION_NOT_FOUND", "Session expired", 401) };

  const user = findUserById(session.nexusId);
  if (!user) return { error: err("USER_NOT_FOUND", "User not found", 401) };

  if (user.role !== "DOCTOR") {
    return {
      error: err("FORBIDDEN", "Doctor access required", 403),
    };
  }

  return { user, session };
}

// ─── GET /api/doctor/profile ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await authenticateDoctorRequest(request);
  if ("error" in auth) return auth.error;

  const profile = findDoctorProfile(auth.user.nexusId);
  if (!profile) {
    return err("PROFILE_NOT_FOUND", "Doctor profile not found", 404);
  }

  return ok({
    nexusId: auth.user.nexusId,
    displayName: auth.user.displayName,
    email: auth.user.email,
    specialization: profile.specialization,
    qualifications: profile.qualifications,
    clinicName: profile.clinicName,
    registrationNumber: profile.registrationNumber,
    consultationAddress: profile.consultationAddress,
    consultationPhone: profile.consultationPhone,
    profileStatus: profile.profileStatus,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  });
}

// ─── PATCH /api/doctor/profile ────────────────────────────────────────────────

const updateSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(200).optional(),
  specialization: z.string().trim().min(2).max(100).optional(),
  qualifications: z.string().trim().max(200).optional().nullable(),
  clinicName: z.string().trim().min(2).max(200).optional(),
  registrationNumber: z.string().trim().max(100).optional().nullable(),
  consultationAddress: z.string().trim().max(300).optional().nullable(),
  consultationPhone: z.string().trim().max(20).optional().nullable(),
});

export async function PATCH(request: NextRequest) {
  const auth = await authenticateDoctorRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    // Update StoredUser fields (displayName, email)
    if (parsed.displayName !== undefined || parsed.email !== undefined) {
      updateUser(auth.user.nexusId, {
        displayName: parsed.displayName,
        email: parsed.email,
      });
    }

    // Update StoredDoctorProfile fields
    const profileUpdated = updateDoctorProfile(auth.user.nexusId, {
      specialization: parsed.specialization,
      qualifications:
        parsed.qualifications === null ? undefined : parsed.qualifications,
      clinicName: parsed.clinicName,
      registrationNumber:
        parsed.registrationNumber === null
          ? undefined
          : parsed.registrationNumber,
      consultationAddress:
        parsed.consultationAddress === null
          ? undefined
          : parsed.consultationAddress,
      consultationPhone:
        parsed.consultationPhone === null
          ? undefined
          : parsed.consultationPhone,
    });

    if (!profileUpdated) {
      return err("PROFILE_NOT_FOUND", "Doctor profile not found", 404);
    }

    // Re-read user for updated values
    const freshUser = findUserById(auth.user.nexusId);

    return ok({
      nexusId: auth.user.nexusId,
      displayName: freshUser?.displayName,
      email: freshUser?.email,
      specialization: profileUpdated.specialization,
      qualifications: profileUpdated.qualifications,
      clinicName: profileUpdated.clinicName,
      registrationNumber: profileUpdated.registrationNumber,
      consultationAddress: profileUpdated.consultationAddress,
      consultationPhone: profileUpdated.consultationPhone,
      profileStatus: profileUpdated.profileStatus,
      createdAt: profileUpdated.createdAt,
      updatedAt: profileUpdated.updatedAt,
    });
  } catch (error) {
    return fromError(error);
  }
}
