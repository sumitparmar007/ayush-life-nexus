/**
 * Doctor Registration Verify API
 *
 * POST /api/doctor/register/verify
 *
 * Verifies OTP and creates the Doctor user + profile.
 * Reuses the existing OTP verification infrastructure.
 * Creates a session and sets the nexus-session cookie.
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  verifyOtp,
  hashPhone,
  findUserByPhone,
  createDoctorUser,
  createDoctorProfile,
  createSession,
} from "@/lib/store.ts";
import { signSessionJwt, makeSetCookieHeader } from "@/lib/session.ts";
import { err, fromError } from "@/lib/api-response.ts";
import { recordActivity } from "@/lib/activity-service.ts";
import { ActivityType } from "@/types/activity.ts";

const schema = z.object({
  requestId: z.string().min(1),
  otp: z.string().trim().length(6).regex(/^\d{6}$/),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/),
  displayName: z.string().trim().min(2).max(100),
  specialization: z.string().trim().min(2).max(100),
  clinicName: z.string().trim().min(2).max(200),
  qualifications: z.string().trim().max(200).optional(),
  registrationNumber: z.string().trim().max(100).optional(),
  consultationAddress: z.string().trim().max(300).optional(),
  consultationPhone: z.string().trim().max(20).optional(),
});

const OTP_ERRORS: Record<string, [string, string, number]> = {
  NOT_FOUND: ["OTP_NOT_FOUND", "OTP session not found or already used", 404],
  EXPIRED: ["OTP_EXPIRED", "OTP has expired. Please request a new one.", 410],
  CONSUMED: ["OTP_CONSUMED", "OTP has already been used. Please request a new one.", 409],
  INVALID: ["OTP_INVALID", "Incorrect OTP. Please try again.", 422],
  RATE_LIMITED: [
    "OTP_RATE_LIMITED",
    "Too many incorrect attempts. Please request a new OTP.",
    429,
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = schema.parse(body);

    // Verify OTP
    const result = verifyOtp(parsed.requestId, parsed.otp);
    if (!result.ok) {
      const [code, message, status] = OTP_ERRORS[result.reason] ?? [
        "UNKNOWN",
        "Unknown error",
        500,
      ];
      return err(code, message, status);
    }

    // Verify phone hash matches the OTP record
    const phoneHash = hashPhone(parsed.phone);
    if (phoneHash !== result.phoneHash) {
      return err("PHONE_MISMATCH", "Phone verification failed", 400);
    }

    // Double-check phone is not already registered (race condition guard)
    const existingUser = findUserByPhone(phoneHash);
    if (existingUser) {
      return err(
        "PHONE_ALREADY_REGISTERED",
        "This phone number is already associated with an account.",
        409
      );
    }

    // Create doctor user
    const user = createDoctorUser(phoneHash, parsed.displayName);

    // Create doctor profile
    createDoctorProfile({
      nexusId: user.nexusId,
      specialization: parsed.specialization,
      clinicName: parsed.clinicName,
      qualifications: parsed.qualifications || undefined,
      registrationNumber: parsed.registrationNumber || undefined,
      consultationAddress: parsed.consultationAddress || undefined,
      consultationPhone: parsed.consultationPhone || undefined,
    });

    // Create session
    const session = createSession(user.nexusId, user.trustLevel, user.authMode);

    // Record login activity
    void recordActivity(user.nexusId, {
      type: ActivityType.LOGIN,
      title: "Account Created",
      description: "Your doctor account was created and you signed in.",
      entityType: "session",
      entityId: session.sessionId,
    });

    // Sign JWT
    const token = await signSessionJwt(session.sessionId);

    const response = NextResponse.json(
      {
        success: true,
        data: {
          nexusId: user.nexusId,
          role: user.role,
          isNewUser: true,
        },
      },
      { status: 201 }
    );
    response.headers.set("Set-Cookie", makeSetCookieHeader(token));
    return response;
  } catch (error) {
    return fromError(error);
  }
}
