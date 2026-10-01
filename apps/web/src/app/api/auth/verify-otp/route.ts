import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp, findUserByPhone, createUser, createSession } from "@/lib/store.ts";
import { signSessionJwt, makeSetCookieHeader } from "@/lib/session.ts";
import { err, fromError } from "@/lib/api-response.ts";
import { recordActivity } from "@/lib/activity-service.ts";
import { ActivityType } from "@/types/activity.ts";

const schema = z.object({
  requestId: z.string().min(1),
  otp: z.string().trim().length(6).regex(/^\d{6}$/),
});

const OTP_ERRORS: Record<string, [string, string, number]> = {
  NOT_FOUND: ["OTP_NOT_FOUND", "OTP session not found or already used", 404],
  EXPIRED:   ["OTP_EXPIRED",   "OTP has expired. Please request a new one.", 410],
  CONSUMED:  ["OTP_CONSUMED",  "OTP has already been used. Please request a new one.", 409],
  INVALID:   ["OTP_INVALID",   "Incorrect OTP. Please try again.", 422],
  RATE_LIMITED: ["OTP_RATE_LIMITED", "Too many incorrect attempts. Please request a new OTP.", 429],
};

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const { requestId, otp } = schema.parse(body);

    const result = verifyOtp(requestId, otp);
    if (!result.ok) {
      const [code, message, status] = OTP_ERRORS[result.reason] ?? ["UNKNOWN", "Unknown error", 500];
      return err(code, message, status);
    }

    // Find or create user
    const user = findUserByPhone(result.phoneHash) ?? createUser(result.phoneHash);

    // Create session in the singleton store
    const session = createSession(user.nexusId, user.trustLevel, user.authMode);

    // Record login activity event
    void recordActivity(user.nexusId, {
      type: ActivityType.LOGIN,
      title: "Session Login",
      description: "You signed in successfully.",
      entityType: "session",
      entityId: session.sessionId,
    });

    // Sign JWT containing only the sessionId
    const token = await signSessionJwt(session.sessionId);

    // Return success — the browser will follow the redirect
    const response = NextResponse.json(
      { success: true, data: { nexusId: user.nexusId, role: user.role, isNewUser: true } },
      { status: 200 }
    );
    response.headers.set("Set-Cookie", makeSetCookieHeader(token));
    return response;
  } catch (error) {
    return fromError(error);
  }
}
